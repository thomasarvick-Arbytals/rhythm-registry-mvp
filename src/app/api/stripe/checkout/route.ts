import { NextResponse } from 'next/server';
import { computePricing } from '@/lib/pricing';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { assignProducerToEvent } from '@/lib/assignment';
import bcrypt from 'bcrypt';
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

  // If a coupon code is provided, first check our internal coupons table (admin-created).
  // If it results in 100% off, we bypass Stripe entirely and treat it as paid.
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ ok: false, error: 'Invalid coupon code.' }, { status: 400 });
    }

    const discounted = Math.max(0, Math.round(totalAmountCents * (1 - coupon.percentOff / 100)));
    if (discounted === 0) {
      const email = body.email.toLowerCase().trim();

      // Create or reuse user; set a temporary password hash so they must set it on success.
      const tempPassword = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : require('crypto').randomUUID();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = await prisma.user.upsert({
        where: { email },
        update: { name: body.name || undefined },
        create: { email, name: body.name || null, passwordHash, role: 'client' },
      });

      const uuid = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : require('crypto').randomUUID();
      const stripeSessionId = `coupon_${Date.now()}_${uuid}`;

      const created = await prisma.event.create({
        data: {
          clientId: user.id,
          eventType: body.eventType,
          eventDate: new Date(body.eventDate),
          durationHours: body.durationHours,
          vibeTags: body.vibeTags,
          status: 'AWAITING_ASSIGNMENT',
          order: {
            create: {
              stripeSessionId,
              totalAmountCents: 0,
              platformFeeCents: 0,
              producerPayoutCents: 0,
              paymentStatus: 'paid',
              couponCode,
            },
          },
          mix: { create: {} },
        },
        select: { id: true },
      });

      // Best-effort assignment
      try {
        await assignProducerToEvent(created.id);
      } catch {
        // ignore
      }

      return NextResponse.json({ ok: true, id: stripeSessionId, url: `${appUrl}/success?session_id=${stripeSessionId}` });
    }
  }

  const stripe = getStripe();

  // Non-free checkouts go through Stripe. If you created a Stripe Promotion Code that matches
  // the coupon code, we'll auto-apply it.
  let promotionCodeId: string | undefined;
  if (couponCode) {
    const promos = await stripe.promotionCodes.list({ code: couponCode, active: true, limit: 1 });
    promotionCodeId = promos.data[0]?.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    allow_promotion_codes: true,
    discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
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
