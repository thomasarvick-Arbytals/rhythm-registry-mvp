import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function creditDjPayout(eventId: string) {
  const ev = await prisma.event.findUnique({ where: { id: eventId }, include: { order: true } });
  if (!ev?.order) throw new Error('Missing order');

  // Idempotency: if already credited, do nothing.
  const credited = await prisma.eventDetail.findUnique({
    where: { eventId_key: { eventId, key: 'djPayoutCreditedAt' } },
  });
  if (credited) return;

  const now = new Date().toISOString();

  await prisma.eventDetail.create({
    data: { eventId, key: 'djPayoutCreditedAt', value: now },
  });
  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'djPayoutCreditedCents' } },
    update: { value: String(ev.order.producerPayoutCents) },
    create: { eventId, key: 'djPayoutCreditedCents', value: String(ev.order.producerPayoutCents) },
  });

  // Mark payout eligible.
  await prisma.event.update({ where: { id: eventId }, data: { status: 'PAYOUT_ELIGIBLE' } });

  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'clientCompletedAt' } },
    update: { value: now },
    create: { eventId, key: 'clientCompletedAt', value: now },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'client') return new NextResponse('Forbidden', { status: 403 });

  const fd = await req.formData().catch(() => null);
  const eventId = fd ? String(fd.get('eventId') || '') : '';
  if (!eventId) return new NextResponse('Missing eventId', { status: 400 });

  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) return new NextResponse('Not found', { status: 404 });
  if (ev.clientId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  await creditDjPayout(eventId);

  return NextResponse.redirect(new URL('/app', req.url), 303);
}
