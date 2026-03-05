import Link from 'next/link';
import { requireRole } from '@/lib/require-role';

export default async function DjHome() {
  await requireRole('dj');

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">DJ</h1>
      <p className="mt-2 text-sm text-neutral-600">Your jobs and progress actions.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link className="rounded border p-4 hover:bg-neutral-50" href="/dj/queue">
          <div className="font-medium">Job Queue</div>
          <div className="text-sm text-neutral-600">First-to-accept wins</div>
        </Link>
        <Link className="rounded border p-4 hover:bg-neutral-50" href="/dj/jobs">
          <div className="font-medium">My Jobs</div>
          <div className="text-sm text-neutral-600">Accepted and in progress</div>
        </Link>
      </div>
    </main>
  );
}
