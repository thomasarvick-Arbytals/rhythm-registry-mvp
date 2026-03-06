import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/roles';
import { getResend } from '@/lib/email';
import { hashToken, newRawToken } from '@/lib/reset-token';

export const runtime = 'nodejs';

function getClientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null
  );
}

async function withinRateLimit(params: { email: string; ip: string | null }) {
  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  // Per-email
  const perEmailLastHour = await prisma.passwordResetToken.count({
    where: {
      user: { email: params.email },
      createdAt: { gte: hourAgo },
    },
  });
  if (perEmailLastHour >= 5) return false;

  const perEmailLastDay = await prisma.passwordResetToken.count({
    where: {
      user: { email: params.email },
      createdAt: { gte: dayAgo },
    },
  });
  if (perEmailLastDay >= 20) return false;

  if (params.ip) {
    const perIpLastHour = await prisma.passwordResetToken.count({
      where: {
        requestedIp: params.ip,
        createdAt: { gte: hourAgo },
      },
    });
    if (perIpLastHour >= 20) return false;
  }

  return true;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | { email?: string };
  const email = body?.email ? normalizeEmail(body.email) : '';

  // Always respond OK (avoid user enumeration)
  const okResponse = NextResponse.json({ ok: true });

  if (!email) return okResponse;

  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent');

  // If user doesn't exist, still return ok.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return okResponse;

  // Rate limit
  const allowed = await withinRateLimit({ email, ip });
  if (!allowed) return okResponse;

  const raw = newRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      requestedIp: ip,
      userAgent: ua,
      expiresAt,
    },
  });

  // Determine base URL for links.
  const xfProto = req.headers.get('x-forwarded-proto');
  const xfHost = req.headers.get('x-forwarded-host');
  const host = xfHost || req.headers.get('host');
  const proto = xfProto || (host?.includes('localhost') ? 'http' : 'https');
  const headerOrigin = req.headers.get('origin');

  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    headerOrigin ||
    (host ? `${proto}://${host}` : 'http://localhost:3000');

  const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${raw}`;

  // Email service configuration
  const from = process.env.RESEND_FROM;
  const hasResendKey = Boolean(process.env.RESEND_API_KEY);

  // If email isn't configured, surface a generic error (doesn't reveal whether the user exists).
  if (!from || !hasResendKey) {
    return NextResponse.json(
      { ok: false, error: 'Email service is not configured. Please contact support.' },
      { status: 500 }
    );
  }

  const resend = getResend();
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: 'Reset your Rhythm Registry password',
      text: [
        'A password reset was requested for your Rhythm Registry account.',
        '',
        `Reset link (expires in 1 hour): ${resetUrl}`,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Unable to send reset email right now. Please try again later.' },
      { status: 502 }
    );
  }

  return okResponse;
}
