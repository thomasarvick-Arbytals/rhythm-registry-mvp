import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const stripe = getStripe();

  // Find events that are FINAL_DELIVERED, have clientApprovedAt older than 48h, and not yet paid out.
  const cutoff = hoursAgo(48).toISOString();

  const approved = await prisma.eventDetail.findMany({
    where: { key: 'clientApprovedAt', value: { lte: cutoff } },
    select: { eventId: true },
  });

  const eventIds = approved.map((a: { eventId: string }) => a.eventId);
  if (eventIds.length === 0) return NextResponse.json({ ok: true, processed: 0 });

  const events = await prisma.event.findMany({
    where: {
      id: { in: eventIds },
      status: { in: ['FINAL_DELIVERED', 'PAYOUT_ELIGIBLE'] },
    },
    include: {
      order: true,
      assignedProducer: { include: { producerProfile: true } },
    },
  });

  let processed = 0;
  const errors: any[] = [];

  for (const ev of events) {
    try {
      if (!ev.order) continue;
      const payoutCents = ev.order.producerPayoutCents;
      const producer = ev.assignedProducer;
      const connectId = producer?.producerProfile?.stripeConnectAccountId;
      if (!connectId) throw new Error('Producer missing Connect account');

      // Transfer
      await stripe.transfers.create({
        amount: payoutCents,
        currency: 'aud',
        destination: connectId,
        metadata: { eventId: ev.id, orderId: ev.order.id },
      });

      await prisma.event.update({ where: { id: ev.id }, data: { status: 'PAID_OUT' } });
      processed += 1;
    } catch (e: any) {
      errors.push({ eventId: ev.id, error: e?.message ?? String(e) });
    }
  }

  return NextResponse.json({ ok: true, processed, errors });
}
