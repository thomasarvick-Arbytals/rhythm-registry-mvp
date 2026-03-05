import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const djs = await prisma.user.findMany({
    where: { role: 'dj' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      producerProfile: { select: { isActive: true, vibeTags: true } },
    },
  });

  return NextResponse.json({ djs });
}
