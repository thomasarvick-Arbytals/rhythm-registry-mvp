import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/reset-token';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { token?: string; password?: string };
  const rawToken = (body?.token || '').trim();
  const password = body?.password || '';

  if (!rawToken || password.length < 8) {
    return new NextResponse('Invalid request', { status: 400 });
  }

  const tokenHash = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // Don't reveal which part failed.
  if (!record) return new NextResponse('Invalid token', { status: 400 });
  if (record.usedAt) return new NextResponse('Token already used', { status: 400 });
  if (record.expiresAt.getTime() < Date.now()) return new NextResponse('Token expired', { status: 400 });

  const hash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
