import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

const BodySchema = z.object({
  sessionId: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = BodySchema.parse(await req.json());

  // Preferred path: order exists (created by webhook)
  const order = await prisma.order.findUnique({ where: { stripeSessionId: body.sessionId } });
  if (order) {
    const event = await prisma.event.findUnique({ where: { id: order.eventId } });
    if (!event) return new NextResponse('Event not found', { status: 404 });

    const passwordHash = await bcrypt.hash(body.password, 10);
    await prisma.user.update({ where: { id: event.clientId }, data: { passwordHash } });

    return NextResponse.json({ ok: true, via: 'db' });
  }

  // Fallback: webhook may be delayed/misconfigured. Retrieve session directly from Stripe.
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(body.sessionId);

  const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
  if (!email) return new NextResponse('No customer email on session', { status: 400 });

  // Only allow setting password for a paid/complete session.
  const paymentOk = session.payment_status === 'paid' || session.status === 'complete';
  if (!paymentOk) return new NextResponse('Session not paid', { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return new NextResponse('User not found', { status: 404 });

  const passwordHash = await bcrypt.hash(body.password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true, via: 'stripe' });
}
