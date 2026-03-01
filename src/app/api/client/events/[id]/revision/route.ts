import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const BodySchema = z.object({
  revisionNotes: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id }, include: { mix: true } });
  if (!event) return new NextResponse('Not found', { status: 404 });
  if (session.user.role !== 'client' || event.clientId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  const body = BodySchema.parse(await req.json());

  await prisma.mix.upsert({
    where: { eventId: id },
    update: { revisionNotes: body.revisionNotes },
    create: { eventId: id, revisionNotes: body.revisionNotes },
  });

  await prisma.event.update({ where: { id }, data: { status: 'REVISION_REQUESTED' } });

  return NextResponse.json({ ok: true });
}
