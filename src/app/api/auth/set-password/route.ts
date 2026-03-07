import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { assignProducerToEvent } from '@/lib/assignment';

const BodySchema = z.object({
  sessionId: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  let body: { sessionId: string; password: string };
  try {
    body = BodySchema.parse(await req.json());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Invalid request: ${msg}` }, { status: 400 });
  }

  // Preferred path: order exists (created by webhook or coupon bypass)
  try {
    const order = await prisma.order.findUnique({ where: { stripeSessionId: body.sessionId } });
    if (order) {
      const event = await prisma.event.findUnique({ where: { id: order.eventId } });
      if (!event) return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 });

      const passwordHash = await bcrypt.hash(body.password, 10);
      await prisma.user.update({ where: { id: event.clientId }, data: { passwordHash } });

      return NextResponse.json({ ok: true, via: 'db' });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `DB error: ${msg}` }, { status: 500 });
  }

  // If this is one of our internal coupon session ids, do NOT query Stripe.
  if (body.sessionId.startsWith('coupon_')) {
    return NextResponse.json({ ok: false, error: 'Order not found for coupon session.' }, { status: 404 });
  }

  // Fallback: webhook may be delayed/misconfigured. Retrieve session directly from Stripe and
  // create the missing user/event/order so the client dashboard works.
  let session: any;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.retrieve(body.sessionId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Unable to retrieve Stripe session: ${msg}` }, { status: 400 });
  }

  const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
  if (!email) return new NextResponse('No customer email on session', { status: 400 });

  // Only allow setting password for a paid/complete session.
  const paymentOk = session.payment_status === 'paid' || session.status === 'complete';
  if (!paymentOk) return new NextResponse('Session not paid', { status: 400 });

  const md: Record<string, string> = session.metadata ?? {};
  const eventType = md.eventType || 'Unknown';
  const eventDate = md.eventDate ? new Date(md.eventDate) : new Date();
  const durationHours = Number(md.durationHours || 2);
  const vibeTags = String(md.vibeTags || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const totalAmountCents = session.amount_total ?? 0;
  const platformFeeCents = Number(md.platformFeeCents || Math.round(totalAmountCents * 0.3));
  const producerPayoutCents = Number(md.producerPayoutCents || totalAmountCents - platformFeeCents);

  const passwordHash = await bcrypt.hash(body.password, 10);

  // Upsert user and set password
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: md.clientName || undefined,
      passwordHash,
    },
    create: {
      email,
      name: md.clientName || null,
      passwordHash,
      role: 'client',
    },
  });

  // Create missing event/order only if it doesn't already exist (by stripeSessionId)
  const stripeSessionId = session.id;
  const stripePaymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined;

  await prisma.event.create({
    data: {
      clientId: user.id,
      eventType,
      eventDate,
      durationHours,
      vibeTags,
      status: 'AWAITING_ASSIGNMENT',
      order: {
        create: {
          stripeSessionId,
          stripePaymentIntentId,
          totalAmountCents,
          platformFeeCents,
          producerPayoutCents,
          paymentStatus: session.payment_status || 'paid',
          couponCode: md.couponCode || null,
        },
      },
      mix: { create: {} },
    },
  }).catch(async (err: unknown) => {
    // If the order already exists, ignore.
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('unique constraint') || msg.toLowerCase().includes('unique')) return;
    throw err;
  });

  // Best-effort assignment
  try {
    const createdOrder = await prisma.order.findUnique({ where: { stripeSessionId } });
    if (createdOrder) {
      const ev = await prisma.event.findUnique({ where: { id: createdOrder.eventId } });
      if (ev) await assignProducerToEvent(ev.id);
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, via: 'stripe' });
}
