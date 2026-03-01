import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'producer') return new NextResponse('Forbidden', { status: 403 });

  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return new NextResponse('Not found', { status: 404 });
  if (event.assignedProducerId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return new NextResponse('Missing file', { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const rel = `${id}/final-${Date.now()}-${file.name}`;
  await storage.save({ relativePath: rel, buffer: buf });

  await prisma.mix.upsert({
    where: { eventId: id },
    update: { finalPath: rel },
    create: { eventId: id, finalPath: rel },
  });

  await prisma.event.update({ where: { id }, data: { status: 'FINAL_DELIVERED' } });

  return NextResponse.json({ ok: true });
}
