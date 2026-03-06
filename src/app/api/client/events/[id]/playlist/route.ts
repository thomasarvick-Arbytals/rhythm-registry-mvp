import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const BodySchema = z.object({
  spotifyPlaylistUrl: z.string().url().or(z.string().min(1)),
  mustPlay: z.string().optional().default(''),
  doNotPlay: z.string().optional().default(''),
  specialMoments: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; role?: string; email?: string } } | null;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return new NextResponse('Not found', { status: 404 });
  if (session.user.role !== 'client' || event.clientId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  const body = BodySchema.parse(await req.json());

  const kv: Array<[string, string]> = [
    ['spotifyPlaylistUrl', body.spotifyPlaylistUrl],
    ['mustPlay', body.mustPlay],
    ['doNotPlay', body.doNotPlay],
    ['specialMoments', body.specialMoments],
    ['notes', body.notes],
  ];

  for (const [key, value] of kv) {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId: id, key } },
      update: { value },
      create: { eventId: id, key, value },
    });
  }

  await prisma.event.update({
    where: { id },
    data: {
      status: event.assignedProducerId ? 'MIXING' : event.status,
    },
  });

  return NextResponse.json({ ok: true });
}
