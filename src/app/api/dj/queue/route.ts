import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Pending job = accepted but not completed.
// Pending count uses: assignedProducerId = DJ and status != PAID_OUT.

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; role?: string; email?: string } } | null;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'dj') return new NextResponse('Forbidden', { status: 403 });

  // DJ must be approved (isActive)
  const profile = await prisma.producerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isActive) return new NextResponse('DJ not approved', { status: 403 });

  // Count pending jobs
  const pendingCount = await prisma.event.count({
    where: {
      assignedProducerId: session.user.id,
      NOT: { status: 'PAID_OUT' },
    },
  });

  // Queue: events awaiting assignment
  const jobs = await prisma.event.findMany({
    where: { status: 'AWAITING_ASSIGNMENT' },
    orderBy: { createdAt: 'asc' },
    include: {
      order: true,
      details: true,
    },
    take: 50,
  });

  const rows = jobs.map((e) => {
    const songList = e.details.find((d) => d.key === 'songList')?.value ?? '';
    const mobile = e.details.find((d) => d.key === 'mobile')?.value ?? '';

    return {
      id: e.id,
      jobId: e.id.slice(0, 8).toUpperCase(),
      packageHours: e.durationHours,
      eventType: e.eventType,
      eventDate: e.eventDate,
      vibeTags: e.vibeTags,
      songList,
      mobile,
      djPayoutCents: e.order?.producerPayoutCents ?? 0,
      deliveryHours: 96,
    };
  });

  return NextResponse.json({ pendingCount, maxPending: 2, jobs: rows });
}
