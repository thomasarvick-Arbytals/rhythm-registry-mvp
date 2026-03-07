'use client';

import { useMemo, useState } from 'react';

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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Start your event</h1>
      <p className="mt-2 text-neutral-600">Answer a few questions, then check out.</p>

      <form
        className="mt-10 space-y-5"
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
            setError('Could not start checkout. Check server logs / env vars.');
            setLoading(false);
            return;
          }

          const data = await res.json();
          window.location.href = data.url;
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium">Event type</div>
            <input className="mt-1 w-full rounded border px-3 py-2" value={eventType} onChange={(e) => setEventType(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Event date</div>
            <input className="mt-1 w-full rounded border px-3 py-2" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <div className="text-sm font-medium">Duration</div>
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
          >
            {durationOptions.map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-sm font-medium">Vibe tags (comma separated)</div>
          <input className="mt-1 w-full rounded border px-3 py-2" value={vibeTags} onChange={(e) => setVibeTags(e.target.value)} />
          <div className="mt-1 text-xs text-neutral-500">Examples: afrobeats, soul, gospel, chill, high-energy</div>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} />
          <span className="text-sm">Rush delivery (+$200)</span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium">Your name</div>
            <input className="mt-1 w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Email</div>
            <input className="mt-1 w-full rounded border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </div>

        <label className="block">
          <div className="text-sm font-medium">Coupon code (optional)</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="e.g. TESTING"
          />
          <div className="mt-1 text-xs text-neutral-500">If you have a promo code, enter it here.</div>
        </label>

        <div className="rounded border bg-neutral-50 p-4">
          <div className="text-sm text-neutral-600">Recommended price</div>
          <div className="text-2xl font-semibold">${price}</div>
        </div>

        {error ? <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}

        <button
          disabled={loading}
          className="w-full rounded bg-black px-4 py-3 text-white disabled:opacity-60"
          type="submit"
        >
          {loading ? 'Redirecting…' : 'Continue to Checkout'}
        </button>
      </form>
    </main>
  );
}
