import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStorage } from '@/lib/storage';
import fs from 'node:fs/promises';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; kind: string }> }) {
  const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; role?: string; email?: string } } | null;
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const { id, kind } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id }, include: { mix: true } });
  if (!event) return new NextResponse('Not found', { status: 404 });

  const isClientOk = session.user.role === 'client' && event.clientId === session.user.id;
  const isProducerOk = session.user.role === 'producer' && event.assignedProducerId === session.user.id;
  const isAdminOk = session.user.role === 'admin';
  if (!isClientOk && !isProducerOk && !isAdminOk) return new NextResponse('Forbidden', { status: 403 });

  const rel = kind === 'preview' ? event.mix?.previewPath : kind === 'final' ? event.mix?.finalPath : null;
  if (!rel) return new NextResponse('No file', { status: 404 });

  const storage = getStorage();
  const abs = storage.getAbsolutePath(rel);
  const buf = await fs.readFile(abs);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': `inline; filename=\"${kind}.bin\"`,
    },
  });
}
