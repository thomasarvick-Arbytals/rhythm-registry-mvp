import { NextResponse } from 'next/server';
import { computePricing } from '@/lib/pricing';
import { getStripe } from '@/lib/stripe';
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

  // Coupon handling:
  // We let Stripe handle promotion codes at checkout (allow_promotion_codes: true).
  // This avoids runtime failures if the DB/migrations aren't present in production.
  const couponCode = (body.couponCode || '').trim().toUpperCase() || undefined;

  const pricing = computePricing({ durationHours: body.durationHours, rush: body.rush });
  const totalAmountCents = pricing.totalAmountCents;

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    allow_promotion_codes: true,
    customer_email: body.email,
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: `Rhythm Registry – ${body.durationHours} Hour Event Mix`,
          },
          unit_amount: totalAmountCents,
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
      couponCode: couponCode ?? '',
      platformFeeCents: String(pricing.platformFeeCents),
      producerPayoutCents: String(pricing.producerPayoutCents),
    },
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/start?canceled=1`,
  });

  return NextResponse.json({ id: session.id, url: session.url });
}
