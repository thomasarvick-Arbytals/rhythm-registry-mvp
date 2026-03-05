import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export default async function DjJobsPage() {
  const session = await requireRole('dj');

  const profile = await prisma.producerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isActive) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">My Jobs</h1>
        <p className="mt-2 text-sm text-neutral-600">Your account is pending admin approval.</p>
      </main>
    );
  }

  const jobs = await prisma.event.findMany({
    where: { assignedProducerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { order: true, details: true, mix: true },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Jobs</h1>
          <p className="mt-2 text-sm text-neutral-600">Accepted jobs and their progress.</p>
        </div>
        <Link className="rounded border px-4 py-2 hover:bg-neutral-50" href="/dj/queue">
          Job Queue
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3">Job</th>
              <th className="p-3">Status</th>
              <th className="p-3">Event</th>
              <th className="p-3">Payout</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t">
                <td className="p-3 font-mono">{j.id.slice(0, 8).toUpperCase()}</td>
                <td className="p-3">{j.status}</td>
                <td className="p-3">{new Date(j.eventDate).toLocaleString()} · {j.eventType}</td>
                <td className="p-3">${((j.order?.producerPayoutCents ?? 0) / 100).toFixed(2)}</td>
                <td className="p-3">
                  <Link className="rounded bg-black px-3 py-1 text-white" href={`/dj/jobs/${j.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
