import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { verifyResetToken } from '@/lib/reset-jwt';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { token?: string; password?: string };
  const token = (body?.token || '').trim();
  const password = body?.password || '';

  if (!token || password.length < 8) {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  let userId = '';
  try {
    userId = (await verifyResetToken(token)).userId;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid or expired token.' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  return NextResponse.json({ ok: true });
}
