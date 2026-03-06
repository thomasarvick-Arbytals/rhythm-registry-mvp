import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; role?: string; email?: string } } | null;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'producer') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return new NextResponse('Not found', { status: 404 });
  if (event.assignedProducerId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  await prisma.event.update({ where: { id }, data: { status: 'MIXING' } });
  return NextResponse.json({ ok: true });
}
