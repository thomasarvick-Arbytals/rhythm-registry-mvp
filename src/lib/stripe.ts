import Stripe from 'stripe';

let cached: Stripe | null = null;

export function getStripe() {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Important: don't crash module evaluation at build time.
    // Fail only when an endpoint actually tries to use Stripe.
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  cached = new Stripe(key);
  return cached;
}
