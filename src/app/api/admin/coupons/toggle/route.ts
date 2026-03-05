import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const body = (await req.json().catch(() => null)) as null | { id?: string; isActive?: boolean };
  if (!body?.id || typeof body.isActive !== 'boolean') return new NextResponse('Missing fields', { status: 400 });

  const updated = await prisma.coupon.update({ where: { id: body.id }, data: { isActive: body.isActive } });
  return NextResponse.json({ coupon: updated });
}
