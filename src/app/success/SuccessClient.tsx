'use client';

import { Field, Input, Notice, PrimaryButton, PublicShell } from '@/components/ui/PublicShell';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SuccessClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get('session_id') || '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <PublicShell
      title="Payment successful"
      subtitle="Next: set a portal password so you can access your event dashboard."
      footer={
        <>
          Already set a password?{' '}
          <a className="underline hover:text-[#e9ecf5]" href="/login">
            Log in
          </a>
        </>
      }
    >
      {!sessionId ? (
        <Notice>
          Missing session id. If you refreshed, try opening this page from the Stripe success redirect.
        </Notice>
      ) : null}

      <form
        className="mt-6 space-y-4"
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
            const text = await res.text().catch(() => '');
            setMsg(text ? `Could not set password: ${text}` : 'Could not set password. Please contact support.');
            setLoading(false);
            return;
          }

          setMsg('Password set. Redirecting to login…');
          setTimeout(() => router.push('/login'), 800);
          setLoading(false);
        }}
      >
        <Field label="Create password (min 8 chars)">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        {msg ? <Notice variant="info">{msg}</Notice> : null}

        <PrimaryButton disabled={loading || password.length < 8}>{loading ? 'Saving…' : 'Set password'}</PrimaryButton>
      </form>
    </PublicShell>
  );
}
