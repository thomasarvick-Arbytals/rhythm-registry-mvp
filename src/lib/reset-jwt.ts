import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.RESET_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('Missing RESET_TOKEN_SECRET (or NEXTAUTH_SECRET)');
  return encoder.encode(secret);
}

export async function signResetToken(payload: { sub: string }, expiresInSeconds = 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(getSecret());
}

export async function verifyResetToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const sub = payload.sub;
  if (!sub || typeof sub !== 'string') throw new Error('Invalid token');
  return { sub };
}
