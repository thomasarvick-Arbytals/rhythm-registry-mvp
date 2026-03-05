export type AppRole = 'client' | 'dj' | 'admin';

export const ADMIN_ALLOWLIST = new Set([
  'product@arbytals.com.au',
  'promise@arbytals.com.au',
]);

export function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

export function roleForSignup(email: string, requested: 'client' | 'dj'):
  | { role: AppRole; requested: 'client' | 'dj' }
  | { role: 'admin'; requested: 'client' | 'dj' } {
  const e = normalizeEmail(email);
  if (ADMIN_ALLOWLIST.has(e)) return { role: 'admin', requested };
  return { role: requested, requested };
}
