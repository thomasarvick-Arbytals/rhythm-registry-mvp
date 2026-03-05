import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const events = await prisma.event.findMany({
    where: { status: 'REVISION_REQUESTED' },
    orderBy: { createdAt: 'desc' },
    include: { details: true, order: true, assignedProducer: true },
  });

  const rows = events.map((e) => {
    const message = e.details.find((d) => d.key === 'changeRequestMessage')?.value ?? '';
    const submittedAt = e.details.find((d) => d.key === 'changeRequestSubmittedAt')?.value ?? '';
    return {
      id: e.id,
      jobId: e.id.slice(0, 8).toUpperCase(),
      eventType: e.eventType,
      eventDate: e.eventDate,
      message,
      submittedAt,
      assignedDjEmail: e.assignedProducer?.email ?? null,
    };
  });

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const body = (await req.json().catch(() => null)) as null | { eventId?: string; decision?: 'approve' | 'reject'; adminNote?: string };
  if (!body?.eventId || !body.decision) return new NextResponse('Missing fields', { status: 400 });

  const eventId = body.eventId;
  const now = new Date().toISOString();

  if (body.decision === 'approve') {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId, key: 'changeRequestApprovedAt' } },
      update: { value: now },
      create: { eventId, key: 'changeRequestApprovedAt', value: now },
    });
    if (body.adminNote?.trim()) {
      await prisma.eventDetail.upsert({
        where: { eventId_key: { eventId, key: 'changeRequestAdminNote' } },
        update: { value: body.adminNote.trim() },
        create: { eventId, key: 'changeRequestAdminNote', value: body.adminNote.trim() },
      });
    }

    // back to mixing
    await prisma.event.update({ where: { id: eventId }, data: { status: 'MIXING' } });
  }

  if (body.decision === 'reject') {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId, key: 'changeRequestRejectedAt' } },
      update: { value: now },
      create: { eventId, key: 'changeRequestRejectedAt', value: now },
    });
    if (body.adminNote?.trim()) {
      await prisma.eventDetail.upsert({
        where: { eventId_key: { eventId, key: 'changeRequestAdminNote' } },
        update: { value: body.adminNote.trim() },
        create: { eventId, key: 'changeRequestAdminNote', value: body.adminNote.trim() },
      });
    }

    // keep preview ready
    await prisma.event.update({ where: { id: eventId }, data: { status: 'PREVIEW_READY' } });
  }

  return NextResponse.json({ ok: true });
}
