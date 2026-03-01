import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'producer') return new NextResponse('Forbidden', { status: 403 });

  const profile = await prisma.producerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return new NextResponse('Producer profile missing', { status: 400 });

  const stripe = getStripe();

  let accountId = profile.stripeConnectAccountId;
  if (!accountId) {
    const acct = await stripe.accounts.create({
      type: 'express',
      capabilities: { transfers: { requested: true } },
    });
    accountId = acct.id;
    await prisma.producerProfile.update({ where: { userId: session.user.id }, data: { stripeConnectAccountId: accountId } });
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/producer/connect?refresh=1`,
    return_url: `${appUrl}/producer/connect?done=1`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: link.url });
}
