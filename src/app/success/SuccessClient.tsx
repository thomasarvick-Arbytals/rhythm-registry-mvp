'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SuccessClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get('session_id') || '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">Payment successful</h1>
      <p className="mt-2 text-sm text-neutral-600">Next: set a portal password so you can access your event dashboard.</p>

      {!sessionId ? (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Missing session id. If you refreshed, try opening this page from the Stripe success redirect.
        </div>
      ) : null}

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setMsg(null);
          const res = await fetch('/api/auth/set-password', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId, password }),
          });
          if (!res.ok) {
            setMsg('Could not set password. Please contact support.');
            setLoading(false);
            return;
          }
          setMsg('Password set. Redirecting to login…');
          setTimeout(() => router.push('/login'), 800);
          setLoading(false);
        }}
      >
        <label className="block">
          <div className="text-sm font-medium">Create password (min 8 chars)</div>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {msg ? <div className="rounded border bg-neutral-50 p-2 text-sm">{msg}</div> : null}

        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={loading || password.length < 8}>
          {loading ? 'Saving…' : 'Set password'}
        </button>
      </form>

      <div className="mt-10 text-sm">
        Already set a password?{' '}
        <a className="underline" href="/login">
          Log in
        </a>
      </div>
    </main>
  );
}
