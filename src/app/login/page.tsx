'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [requestedRole, setRequestedRole] = useState<'client' | 'dj'>('client');

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-2 text-sm text-neutral-600">Log in, or create an account below.</p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className={`rounded border px-3 py-1 text-sm ${mode === 'login' ? 'bg-black text-white' : ''}`}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`rounded border px-3 py-1 text-sm ${mode === 'signup' ? 'bg-black text-white' : ''}`}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>

      <form
        className="mt-4 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          try {
            if (mode === 'signup') {
              const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, requestedRole }),
              });
              if (!res.ok) throw new Error(await res.text());
            }

            const res2 = await signIn('credentials', {
              email,
              password,
              redirect: true,
              callbackUrl: '/router',
            });
            if (res2?.error) setError('Invalid email or password');
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
          } finally {
            setLoading(false);
          }
        }}
      >
        {mode === 'signup' ? (
          <label className="block">
            <div className="text-sm font-medium">Name</div>
            <input className="mt-1 w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        ) : null}

        {mode === 'signup' ? (
          <label className="block">
            <div className="text-sm font-medium">Account type</div>
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as 'client' | 'dj')}
            >
              <option value="client">Client</option>
              <option value="dj">DJ</option>
            </select>
            <div className="mt-1 text-xs text-neutral-600">Admin is allowlisted (product@ / promise@).</div>
          </label>
        ) : null}

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
          {loading ? 'Working…' : mode === 'signup' ? 'Create account & log in' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
