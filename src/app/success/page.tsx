import { Suspense } from 'react';
import { PublicShell } from '@/components/ui/PublicShell';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <PublicShell title="Payment successful" subtitle="Loading your order…">
          <div className="text-sm text-[#aab1c6]">Loading…</div>
        </PublicShell>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
