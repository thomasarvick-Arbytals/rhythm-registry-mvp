import Link from 'next/link';
import { requireRole } from '@/lib/require-role';

export default async function ClientAppHome() {
  await requireRole('client');

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Client Dashboard</h1>
      <p className="mt-2 text-sm text-neutral-600">Track your project status and preview your mix.</p>

      <div className="mt-6 rounded border p-4">
        <div className="text-sm text-neutral-600">MVP placeholder</div>
        <div className="mt-2">Your projects will appear here once you complete checkout.</div>
      </div>

      <div className="mt-6">
        <Link className="rounded border px-4 py-2 hover:bg-neutral-50" href="/start">
          Start a new request
        </Link>
      </div>
    </main>
  );
}
