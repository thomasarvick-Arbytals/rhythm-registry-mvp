'use client';

import { Field, Input, Notice, PrimaryButton, PublicShell, Select } from '@/components/ui/PublicShell';
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
    <PublicShell title={mode === 'signup' ? 'Create your account' : 'Log in'} subtitle="Log in, create an account, or reset your password.">
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-xl border px-3 py-2 text-sm ${mode === 'login' ? 'border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)]' : 'border-white/10 bg-[rgba(15,19,32,.55)]'}`}
          onClick={() => setMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`rounded-xl border px-3 py-2 text-sm ${mode === 'signup' ? 'border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)]' : 'border-white/10 bg-[rgba(15,19,32,.55)]'}`}
          onClick={() => setMode('signup')}
        >
          Sign up
        </button>
      </div>

      <form
        className="mt-6 space-y-4"
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
              redirect: false,
              callbackUrl: '/router',
            });

            if (res2?.error) {
              setError('Invalid email or password');
              return;
            }

            // NextAuth won't navigate when redirect=false, so do it ourselves.
            window.location.href = res2?.url || '/router';
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
          } finally {
            setLoading(false);
          }
        }}
      >
        {mode === 'login' ? (
          <div className="text-right">
            <a className="text-sm text-[#aab1c6] underline hover:text-[#e9ecf5]" href="/forgot-password">
              Forgot password?
            </a>
          </div>
        ) : null}

        {mode === 'signup' ? (
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        ) : null}

        {mode === 'signup' ? (
          <Field label="Account type" hint="Admin is allowlisted (product@ / promise@).">
            <Select value={requestedRole} onChange={(e) => setRequestedRole(e.target.value as 'client' | 'dj')}>
              <option value="client">Client</option>
              <option value="dj">DJ</option>
            </Select>
          </Field>
        ) : null}

        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        {error ? <Notice>{error}</Notice> : null}

        <PrimaryButton disabled={loading}>{loading ? 'Working…' : mode === 'signup' ? 'Create account & log in' : 'Log in'}</PrimaryButton>
      </form>
    </PublicShell>
  );
}
