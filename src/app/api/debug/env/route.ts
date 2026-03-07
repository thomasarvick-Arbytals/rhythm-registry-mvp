import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  // Do NOT return secret values. Only return presence booleans + non-sensitive identifiers.
  return NextResponse.json({
    ok: true,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasResendFrom: Boolean(process.env.RESEND_FROM),
    resendFromDomain: process.env.RESEND_FROM?.split('@')[1]?.replace(/>.*/, '') || null,
    hasResetTokenSecret: Boolean(process.env.RESET_TOKEN_SECRET),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    hasNextPublicAppUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    hasAppUrl: Boolean(process.env.APP_URL),
    hasStripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    hasStripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    nodeEnv: process.env.NODE_ENV,
  });
}
