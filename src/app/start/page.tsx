'use client';

import { useMemo, useState } from 'react';
import { Field, Input, Notice, PrimaryButton, PublicShell, Select } from '@/components/ui/PublicShell';

const durationOptions = [2, 3, 4, 5, 6] as const;

function computeDisplayPrice(durationHours: number, rush: boolean) {
  const base: Record<number, number> = { 2: 380, 3: 540, 4: 640, 5: 700, 6: 720 };
  const total = (base[durationHours] ?? 0) + (rush ? 200 : 0);
  return total;
}

export default function StartPage() {
  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState('');
  const [durationHours, setDurationHours] = useState<number>(4);
  const [vibeTags, setVibeTags] = useState('afrobeats, rnb, upbeat');
  const [rush, setRush] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(() => computeDisplayPrice(durationHours, rush), [durationHours, rush]);

  return (
    <PublicShell title="Start your event" subtitle="Answer a few questions, then check out.">
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          const vibe = vibeTags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              eventType,
              eventDate: eventDate ? new Date(eventDate).toISOString() : new Date().toISOString(),
              durationHours,
              vibeTags: vibe,
              rush,
              name,
              email,
              couponCode: couponCode.trim() || undefined,
            }),
          });

          if (!res.ok) {
            const msg = await res
              .json()
              .then((j: unknown) => {
                if (j && typeof j === 'object' && 'error' in j && typeof (j as { error?: unknown }).error === 'string') {
                  return (j as { error: string }).error;
                }
                return JSON.stringify(j);
              })
              .catch(async () => await res.text());
            setError(msg || 'Could not start checkout.');
            setLoading(false);
            return;
          }

          const data = await res.json();
          window.location.href = data.url;
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Event type">
            <Input value={eventType} onChange={(e) => setEventType(e.target.value)} />
          </Field>
          <Field label="Event date">
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Duration">
          <Select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))}>
            {durationOptions.map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Vibe tags (comma separated)" hint="Examples: afrobeats, soul, gospel, chill, high-energy">
          <Input value={vibeTags} onChange={(e) => setVibeTags(e.target.value)} />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input className="h-4 w-4" type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} />
          <span>Rush delivery (+$200)</span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Your name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
        </div>

        <Field label="Coupon code (optional)" hint="Promo codes can also be entered on the Stripe checkout page.">
          <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. TESTING" />
        </Field>

        <div className="rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-4">
          <div className="text-sm text-[#aab1c6]">Recommended price</div>
          <div className="text-2xl font-semibold">${price}</div>
        </div>

        {error ? <Notice>{error}</Notice> : null}

        <PrimaryButton disabled={loading}>{loading ? 'Redirecting…' : 'Continue to Checkout'}</PrimaryButton>
      </form>
    </PublicShell>
  );
}
