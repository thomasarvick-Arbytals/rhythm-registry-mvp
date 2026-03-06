import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; role?: string; email?: string } } | null;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'client') return new NextResponse('Forbidden', { status: 403 });

  const fd = await req.formData().catch(() => null);
  const eventId = fd ? String(fd.get('eventId') || '') : '';
  const message = fd ? String(fd.get('message') || '') : '';
  if (!eventId) return new NextResponse('Missing eventId', { status: 400 });
  if (!message.trim()) return new NextResponse('Missing message', { status: 400 });

  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) return new NextResponse('Not found', { status: 404 });
  if (ev.clientId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  const now = new Date().toISOString();

  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'changeRequestMessage' } },
    update: { value: message.trim() },
    create: { eventId, key: 'changeRequestMessage', value: message.trim() },
  });
  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'changeRequestSubmittedAt' } },
    update: { value: now },
    create: { eventId, key: 'changeRequestSubmittedAt', value: now },
  });

  // Admin-gated flow: mark status
  await prisma.event.update({ where: { id: eventId }, data: { status: 'REVISION_REQUESTED' } });

  return NextResponse.redirect(new URL('/app', req.url), 303);
}
