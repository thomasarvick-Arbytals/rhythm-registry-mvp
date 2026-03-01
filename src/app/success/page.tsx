import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-6 py-16">Loading…</div>}>
      <SuccessClient />
    </Suspense>
  );
}
