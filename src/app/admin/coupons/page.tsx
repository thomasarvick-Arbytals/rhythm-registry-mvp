'use client';

import { useEffect, useState } from 'react';

type Coupon = { id: string; code: string; percentOff: number; isActive: boolean; createdAt: string };

export default function AdminCouponsPage() {
  const [code, setCode] = useState('');
  const [percentOff, setPercentOff] = useState(100);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch('/api/admin/coupons');
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setCoupons(data.coupons);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Coupons</h1>
      <p className="mt-2 text-sm text-neutral-600">Create coupons for testing checkout without Stripe.</p>

      {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form
        className="mt-6 grid gap-3 rounded border p-4 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          try {
            const res = await fetch('/api/admin/coupons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, percentOff }),
            });
            if (!res.ok) throw new Error(await res.text());
            setCode('');
            setPercentOff(100);
            await refresh();
          } catch (e) {
            setError(String(e));
          } finally {
            setLoading(false);
          }
        }}
      >
        <label className="block">
          <div className="text-sm font-medium">Code</div>
          <input className="mt-1 w-full rounded border px-3 py-2" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </label>
        <label className="block">
          <div className="text-sm font-medium">% off</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="number"
            min={0}
            max={100}
            value={percentOff}
            onChange={(e) => setPercentOff(Number(e.target.value))}
          />
        </label>
        <div className="flex items-end">
          <button className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>

      <div className="mt-8 overflow-hidden rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">% off</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.percentOff}%</td>
                <td className="p-3">{c.isActive ? 'Yes' : 'No'}</td>
                <td className="p-3">
                  <button
                    className="rounded border px-3 py-1 hover:bg-neutral-50"
                    onClick={async () => {
                      const res = await fetch('/api/admin/coupons/toggle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
                      });
                      if (!res.ok) {
                        setError(await res.text());
                        return;
                      }
                      await refresh();
                    }}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
