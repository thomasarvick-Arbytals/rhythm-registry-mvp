import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const body = (await req.json().catch(() => null)) as null | { code?: string; percentOff?: number };
  const code = (body?.code || '').trim().toUpperCase();
  const percentOff = Number(body?.percentOff ?? NaN);
  if (!code) return new NextResponse('Missing code', { status: 400 });
  if (!Number.isFinite(percentOff) || percentOff < 0 || percentOff > 100) {
    return new NextResponse('Invalid percentOff (0-100)', { status: 400 });
  }

  const created = await prisma.coupon.create({
    data: { code, percentOff, isActive: true },
  });

  return NextResponse.json({ coupon: created });
}
