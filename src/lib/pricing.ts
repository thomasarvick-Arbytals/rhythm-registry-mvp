export type PricingInput = {
  durationHours: number;
  rush: boolean;
};

const BASE_BY_HOURS: Record<number, number> = {
  2: 380,
  3: 540,
  4: 640,
  5: 700,
  6: 720,
};

export function computePricing({ durationHours, rush }: PricingInput) {
  const base = BASE_BY_HOURS[durationHours];
  if (!base) throw new Error(`Unsupported durationHours: ${durationHours}`);

  const rushAdd = rush ? 200 : 0;
  const totalDollars = base + rushAdd;
  const totalAmountCents = Math.round(totalDollars * 100);

  // platform fee = 30%, producer payout = 70%
  const platformFeeCents = Math.round(totalAmountCents * 0.3);
  const producerPayoutCents = totalAmountCents - platformFeeCents;

  return {
    baseDollars: base,
    rushAddDollars: rushAdd,
    totalDollars,
    totalAmountCents,
    platformFeeCents,
    producerPayoutCents,
  };
}
