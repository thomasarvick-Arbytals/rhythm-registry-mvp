import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type Action = 'start' | 'wip' | 'awaiting_preview';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'dj') return new NextResponse('Forbidden', { status: 403 });

  const profile = await prisma.producerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isActive) return new NextResponse('DJ not approved', { status: 403 });

  const fd = await req.formData().catch(() => null);
  const eventId = fd ? String(fd.get('eventId') || '') : '';
  const action = fd ? (String(fd.get('action') || '') as Action) : ('' as Action);
  if (!eventId) return new NextResponse('Missing eventId', { status: 400 });
  if (!['start', 'wip', 'awaiting_preview'].includes(action)) return new NextResponse('Invalid action', { status: 400 });

  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) return new NextResponse('Not found', { status: 404 });
  if (ev.assignedProducerId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  const now = new Date().toISOString();

  if (action === 'start') {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId, key: 'djStartedAt' } },
      update: { value: now },
      create: { eventId, key: 'djStartedAt', value: now },
    });
  }

  if (action === 'wip') {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId, key: 'djWipAt' } },
      update: { value: now },
      create: { eventId, key: 'djWipAt', value: now },
    });
    await prisma.event.update({ where: { id: eventId }, data: { status: 'MIXING' } });
  }

  if (action === 'awaiting_preview') {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId, key: 'awaitingPreviewAt' } },
      update: { value: now },
      create: { eventId, key: 'awaitingPreviewAt', value: now },
    });
    await prisma.event.update({ where: { id: eventId }, data: { status: 'PREVIEW_READY' } });
  }

  return NextResponse.redirect(new URL(`/dj/jobs/${eventId}`, req.url), 303);
}
