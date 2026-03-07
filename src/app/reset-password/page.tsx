'use client';

import { Field, Input, Notice, PrimaryButton, PublicShell } from '@/components/ui/PublicShell';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <PublicShell title="Reset password" subtitle="Set a new password for your account.">
      {done ? (
        <Notice variant="info">
          Password updated.{' '}
          <button className="underline" onClick={() => router.push('/login')}>
            Go to login
          </button>
        </Notice>
      ) : (
        <form
          className="space-y-4"
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
          <Field label="New password" hint="Minimum 8 characters.">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          {error ? <Notice>{error}</Notice> : null}

          <PrimaryButton>Reset password</PrimaryButton>
        </form>
      )}

      {!token ? <Notice>Missing reset token. Use the link from your email.</Notice> : null}
    </PublicShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
