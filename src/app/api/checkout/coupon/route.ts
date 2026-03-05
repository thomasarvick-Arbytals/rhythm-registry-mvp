import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/roles';
import { sendTempPasswordEmail } from '@/lib/email';

export const runtime = 'nodejs';

function djPayoutCentsFromTotal(totalCents: number) {
  // DJ payout is 20% of client-paid amount
  return Math.round(totalCents * 0.2);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    email?: string;
    mobile?: string;
    eventType?: string;
    eventDate?: string;
    durationHours?: number;
    vibeTags?: string;
    songList?: string;
    couponCode?: string;
    packageTotalCents?: number;
  };

  if (!body?.email || !body?.eventType || !body?.eventDate || !body?.durationHours || !body?.packageTotalCents) {
    return new NextResponse('Missing required fields', { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const couponCode = (body.couponCode || '').trim().toUpperCase() || null;

  let percentOff = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) return new NextResponse('Invalid coupon', { status: 400 });
    percentOff = coupon.percentOff;
  }

  const totalAmountCents = Math.max(0, Math.round(body.packageTotalCents * (1 - percentOff / 100)));

  // Create (or re-use) client user. If new user, generate temp password and email it.
  const existing = await prisma.user.findUnique({ where: { email } });
  let tempPassword: string | null = null;

  if (!existing) {
    tempPassword = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.create({
      data: {
        email,
        name: null,
        passwordHash,
        role: 'client',
      },
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return new NextResponse('Failed to create user', { status: 500 });

  const producerPayoutCents = djPayoutCentsFromTotal(totalAmountCents);
  const platformFeeCents = Math.max(0, totalAmountCents - producerPayoutCents);

  const event = await prisma.event.create({
    data: {
      clientId: user.id,
      eventType: body.eventType,
      eventDate: new Date(body.eventDate),
      durationHours: Math.round(body.durationHours),
      vibeTags: (body.vibeTags || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: 'AWAITING_ASSIGNMENT',
      details: {
        create: (() => {
          const arr: Array<{ key: string; value: string }> = [];
          if (body.mobile) arr.push({ key: 'mobile', value: body.mobile });
          if (body.songList) arr.push({ key: 'songList', value: body.songList });
          arr.push({ key: 'couponPercent', value: String(percentOff) });
          arr.push({ key: 'clientTotalAmountCents', value: String(totalAmountCents) });
          return arr;
        })(),
      },
      order: {
        create: {
          stripeSessionId: `coupon_${Date.now()}_${crypto.randomUUID()}`,
          totalAmountCents,
          platformFeeCents,
          producerPayoutCents,
          paymentStatus: 'paid',
          couponCode,
        },
      },
      mix: { create: {} },
    },
    select: { id: true },
  });

  if (tempPassword) {
    await sendTempPasswordEmail({ to: email, tempPassword });
  }

  return NextResponse.json({ ok: true, eventId: event.id, percentOff, totalAmountCents });
}
