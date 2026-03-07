import { NextResponse } from 'next/server';
import { computePricing } from '@/lib/pricing';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const BodySchema = z.object({
  eventType: z.string().min(1),
  eventDate: z.string().min(1), // ISO
  durationHours: z.number().int(),
  vibeTags: z.array(z.string()).default([]),
  rush: z.boolean().default(false),
  name: z.string().optional(),
  email: z.string().email(),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const body = BodySchema.parse(json);

  // Optional coupon
  let percentOff = 0;
  const couponCode = (body.couponCode || '').trim().toUpperCase();
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ ok: false, error: 'Invalid coupon code.' }, { status: 400 });
    }
    percentOff = coupon.percentOff;
  }

  const pricing = computePricing({ durationHours: body.durationHours, rush: body.rush });
  const discountedTotalCents = Math.max(0, Math.round(pricing.totalAmountCents * (1 - percentOff / 100)));

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: body.email,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: `Rhythm Registry – ${body.durationHours} Hour Event Mix`,
          },
          unit_amount: discountedTotalCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventType: body.eventType,
      eventDate: body.eventDate,
      durationHours: String(body.durationHours),
      vibeTags: body.vibeTags.join(','),
      rush: String(body.rush),
      clientName: body.name ?? '',
      couponCode,
      couponPercentOff: String(percentOff),
      platformFeeCents: String(pricing.platformFeeCents),
      producerPayoutCents: String(pricing.producerPayoutCents),
    },
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/start?canceled=1`,
  });

  return NextResponse.json({ id: session.id, url: session.url });
}
