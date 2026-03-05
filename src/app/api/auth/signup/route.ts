import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { normalizeEmail, roleForSignup } from '@/lib/roles';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    name?: string;
    email?: string;
    password?: string;
    requestedRole?: 'client' | 'dj';
  };

  if (!body?.email || !body?.password || !body.requestedRole) {
    return new NextResponse('Missing fields', { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = body.password;

  if (password.length < 8) return new NextResponse('Password too short', { status: 400 });

  const { role } = roleForSignup(email, body.requestedRole);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return new NextResponse('User already exists', { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: body.name ?? null,
      passwordHash,
      role,
      producerProfile:
        role === 'dj'
          ? {
              create: {
                vibeTags: [],
                isActive: false, // admin must approve
              },
            }
          : undefined,
    },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ ok: true, user });
}
