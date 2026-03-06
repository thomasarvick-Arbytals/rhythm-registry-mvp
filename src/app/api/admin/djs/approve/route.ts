import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; role?: string; email?: string } } | null;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const body = (await req.json().catch(() => null)) as null | { userId?: string; approve?: boolean };
  if (!body?.userId || typeof body.approve !== 'boolean') return new NextResponse('Missing fields', { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!user) return new NextResponse('Not found', { status: 404 });
  if (user.role !== 'dj') return new NextResponse('Not a DJ', { status: 400 });

  const updated = await prisma.producerProfile.update({
    where: { userId: body.userId },
    data: { isActive: body.approve },
  });

  return NextResponse.json({ ok: true, profile: updated });
}
