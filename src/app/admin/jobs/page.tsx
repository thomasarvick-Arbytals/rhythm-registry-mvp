import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

function statusLabel(status: string) {
  switch (status) {
    case 'PLAYLIST_PENDING':
    case 'AWAITING_ASSIGNMENT':
      return 'Queued';
    case 'ASSIGNED':
      return 'Assigned';
    case 'MIXING':
      return 'Mixing';
    case 'PREVIEW_READY':
      return 'Preview ready';
    case 'REVISION_REQUESTED':
      return 'Revision requested';
    case 'FINAL_DELIVERED':
      return 'Final delivered';
    case 'PAYOUT_ELIGIBLE':
      return 'Payout eligible';
    case 'PAID_OUT':
      return 'Paid out';
    default:
      return status;
  }
}

export default async function AdminJobsPage() {
  await requireRole('admin');

  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      client: true,
      order: true,
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="mt-2 text-sm text-neutral-600">Monitor jobs and (soon) reassign DJs.</p>
        </div>
        <Link className="rounded border px-4 py-2 hover:bg-neutral-50" href="/admin">
          Back
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3">Job</th>
              <th className="p-3">Status</th>
              <th className="p-3">Client</th>
              <th className="p-3">Event</th>
              <th className="p-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-mono">{e.id.slice(0, 8).toUpperCase()}</td>
                <td className="p-3">{statusLabel(e.status)}</td>
                <td className="p-3">
                  <div className="font-medium">{e.client?.name || '—'}</div>
                  <div className="text-xs text-neutral-500">{e.client?.email || ''}</div>
                </td>
                <td className="p-3">{new Date(e.eventDate).toLocaleString()} · {e.eventType}</td>
                <td className="p-3">{e.order?.paymentStatus || '—'}</td>
              </tr>
            ))}

            {events.length === 0 ? (
              <tr>
                <td className="p-3 text-sm text-neutral-600" colSpan={5}>
                  No jobs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded border p-4 text-sm text-neutral-600">
        Reassignment tools coming next: force unassign, re-run assignment, and view producer queue.
      </div>
    </main>
  );
}
