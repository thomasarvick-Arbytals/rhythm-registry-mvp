'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="mt-2 text-sm text-neutral-600">We’ll email you a password reset link.</p>

      {sent ? (
        <div className="mt-6 rounded border bg-green-50 p-3 text-sm">If an account exists for that email, a reset link has been sent.</div>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const res = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            if (!res.ok) {
              setError(await res.text());
              return;
            }
            setSent(true);
          }}
        >
          <label className="block">
            <div className="text-sm font-medium">Email</div>
            <input className="mt-1 w-full rounded border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          {error ? <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}

          <button className="w-full rounded bg-black px-4 py-2 text-white" type="submit">
            Send reset link
          </button>
        </form>
      )}
    </main>
  );
}
