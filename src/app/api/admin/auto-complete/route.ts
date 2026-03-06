import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

async function creditDjPayout(eventId: string) {
  const ev = await prisma.event.findUnique({ where: { id: eventId }, include: { order: true } });
  if (!ev?.order) return;

  const credited = await prisma.eventDetail.findUnique({
    where: { eventId_key: { eventId, key: 'djPayoutCreditedAt' } },
  });
  if (credited) return;

  const now = new Date().toISOString();
  await prisma.eventDetail.create({ data: { eventId, key: 'djPayoutCreditedAt', value: now } });
  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'djPayoutCreditedCents' } },
    update: { value: String(ev.order.producerPayoutCents) },
    create: { eventId, key: 'djPayoutCreditedCents', value: String(ev.order.producerPayoutCents) },
  });

  await prisma.event.update({ where: { id: eventId }, data: { status: 'PAYOUT_ELIGIBLE' } });
  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'autoCompletedAt' } },
    update: { value: now },
    create: { eventId, key: 'autoCompletedAt', value: now },
  });
}

export async function POST() {
  const session = (await getServerSession(authOptions as any)) as { user?: { role?: string } } | null;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const cutoff = hoursAgo(72);
  const awaiting = await prisma.eventDetail.findMany({
    where: { key: 'awaitingPreviewAt', value: { lte: cutoff } },
    select: { eventId: true },
  });

  let processed = 0;
  for (const row of awaiting) {
    await creditDjPayout(row.eventId);
    processed += 1;
  }

  return NextResponse.json({ ok: true, processed });
}
