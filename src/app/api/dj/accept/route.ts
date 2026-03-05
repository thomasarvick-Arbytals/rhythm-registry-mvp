import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'dj') return new NextResponse('Forbidden', { status: 403 });

  const profile = await prisma.producerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isActive) return new NextResponse('DJ not approved', { status: 403 });

  const body = await req.formData().catch(() => null);
  const eventId = body ? String(body.get('eventId') || '') : '';
  if (!eventId) return new NextResponse('Missing eventId', { status: 400 });

  const pendingCount = await prisma.event.count({
    where: {
      assignedProducerId: session.user.id,
      NOT: { status: 'PAID_OUT' },
    },
  });
  if (pendingCount >= 2) return new NextResponse('Pending job limit reached', { status: 400 });

  const updated = await prisma.event.updateMany({
    where: { id: eventId, status: 'AWAITING_ASSIGNMENT' },
    data: { assignedProducerId: session.user.id, status: 'ASSIGNED' },
  });

  if (updated.count === 0) return new NextResponse('Job already taken', { status: 409 });

  const now = new Date().toISOString();
  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'djAcceptedAt' } },
    update: { value: now },
    create: { eventId, key: 'djAcceptedAt', value: now },
  });

  return NextResponse.redirect(new URL('/dj/jobs', req.url), 303);
}
