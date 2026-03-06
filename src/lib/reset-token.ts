import crypto from 'crypto';

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function newRawToken() {
  return crypto.randomBytes(32).toString('hex');
}
