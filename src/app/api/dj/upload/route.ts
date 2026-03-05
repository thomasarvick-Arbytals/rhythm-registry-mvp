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

  const fd = await req.formData().catch(() => null);
  const eventId = fd ? String(fd.get('eventId') || '') : '';
  const chapters = fd ? String(fd.get('chapters') || '') : '';
  if (!eventId) return new NextResponse('Missing eventId', { status: 400 });

  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) return new NextResponse('Not found', { status: 404 });
  if (ev.assignedProducerId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  await prisma.eventDetail.upsert({
    where: { eventId_key: { eventId, key: 'chapters' } },
    update: { value: chapters },
    create: { eventId, key: 'chapters', value: chapters },
  });

  return NextResponse.redirect(new URL(`/dj/jobs/${eventId}`, req.url), 303);
}
