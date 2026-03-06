'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-neutral-600">Set a new password for your account.</p>

      {done ? (
        <div className="mt-6 rounded border bg-green-50 p-3 text-sm">
          Password updated.{' '}
          <button className="underline" onClick={() => router.push('/login')}>
            Go to login
          </button>
        </div>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const res = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, password }),
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
              setError(msg || 'Something went wrong.');
              return;
            }
            setDone(true);
          }}
        >
          <label className="block">
            <div className="text-sm font-medium">New password</div>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="mt-1 text-xs text-neutral-600">Minimum 8 characters.</div>
          </label>

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
          ) : null}

          <button className="w-full rounded bg-black px-4 py-2 text-white" type="submit">
            Reset password
          </button>
        </form>
      )}

      {!token ? (
        <div className="mt-6 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm">
          Missing reset token. Use the link from your email.
        </div>
      ) : null}
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
