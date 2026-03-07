'use client';

import { Field, Input, Notice, PrimaryButton, PublicShell } from '@/components/ui/PublicShell';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <PublicShell title="Forgot password" subtitle="We’ll email you a password reset link.">
      {sent ? (
        <Notice variant="info">If an account exists for that email, a reset link has been sent.</Notice>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const res = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });

            const data = await res
              .json()
              .catch(async () => ({ ok: false, error: await res.text() }));

            if (!res.ok || !data?.ok) {
              const msg =
                (data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string'
                  ? (data as { error: string }).error
                  : '') || 'Something went wrong.';
              setError(msg);
              return;
            }

            // Temporary fallback: backend can return a resetUrl for internal accounts
            if (data && typeof data === 'object' && 'resetUrl' in data && typeof (data as { resetUrl?: unknown }).resetUrl === 'string') {
              setError(`Reset link: ${(data as { resetUrl: string }).resetUrl}`);
              setSent(true);
              return;
            }

            setSent(true);
          }}
        >
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          {error ? <Notice>{error}</Notice> : null}

          <PrimaryButton>Send reset link</PrimaryButton>
        </form>
      )}
    </PublicShell>
  );
}
