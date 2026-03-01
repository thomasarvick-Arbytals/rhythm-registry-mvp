import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const BodySchema = z.object({
  sessionId: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = BodySchema.parse(await req.json());

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: body.sessionId },
    include: { event: true },
  });
  if (!order) return new NextResponse('Order not found', { status: 404 });

  const event = await prisma.event.findUnique({ where: { id: order.eventId } });
  if (!event) return new NextResponse('Event not found', { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: event.clientId } });
  if (!user) return new NextResponse('User not found', { status: 404 });

  const passwordHash = await bcrypt.hash(body.password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
