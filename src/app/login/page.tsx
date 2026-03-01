'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-neutral-600">Use the email you paid with (or were invited with).</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          const res = await signIn('credentials', {
            email,
            password,
            redirect: true,
            callbackUrl: '/router',
          });
          if ((res as any)?.error) setError('Invalid email or password');
          setLoading(false);
        }}
      >
        <label className="block">
          <div className="text-sm font-medium">Email</div>
          <input className="mt-1 w-full rounded border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm font-medium">Password</div>
          <input className="mt-1 w-full rounded border px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error ? <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div> : null}

        <button
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
          type="submit"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
