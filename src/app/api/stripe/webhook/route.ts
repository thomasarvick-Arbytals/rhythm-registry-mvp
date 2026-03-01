import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import bcrypt from 'bcrypt';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { assignProducerToEvent } from '@/lib/assignment';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return new NextResponse('Missing stripe signature/secret', { status: 400 });

  const rawBody = await req.text();
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;

    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
    if (!email) return new NextResponse('No customer email', { status: 400 });

    const md = session.metadata || {};
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

    const stripeSessionId = session.id as string;
    const stripePaymentIntentId = session.payment_intent as string | undefined;

    const existingOrder = await prisma.order.findUnique({ where: { stripeSessionId } });
    if (existingOrder) return NextResponse.json({ received: true, deduped: true });

    const tempPassword = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: md.clientName || undefined,
      },
      create: {
        email,
        name: md.clientName || null,
        passwordHash,
        role: 'client',
      },
    });

    const created = await prisma.event.create({
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
          },
        },
      },
    });

    await prisma.mix.create({ data: { eventId: created.id } });

    // Auto-assign producer
    await assignProducerToEvent(created.id);

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, ignored: true });
}
