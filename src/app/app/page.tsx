import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

function clientStatusLabel(ev: { status: string }) {
  // Client-visible statuses:
  // Request Submitted → DJ Accepted → In Progress → Awaiting Preview → Completed
  switch (ev.status) {
    case 'AWAITING_ASSIGNMENT':
    case 'PLAYLIST_PENDING':
      return 'Request Submitted';
    case 'ASSIGNED':
      return 'DJ Accepted';
    case 'MIXING':
      return 'In Progress';
    case 'PREVIEW_READY':
      return 'Awaiting Preview';
    case 'PAYOUT_ELIGIBLE':
    case 'PAID_OUT':
    case 'FINAL_DELIVERED':
      return 'Completed';
    default:
      return ev.status;
  }
}

function getDetail(details: Array<{ key: string; value: string }>, key: string) {
  return details.find((d) => d.key === key)?.value ?? '';
}

export default async function ClientAppHome() {
  const session = await requireRole('client');

  const events = await prisma.event.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { order: true, details: true },
    take: 25,
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Client Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">Track your project status and preview your mix when ready.</p>
        </div>
        <Link className="rounded border px-4 py-2 hover:bg-neutral-50" href="/start">
          New request
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-6 rounded border p-4">
          <div className="text-sm text-neutral-600">No projects yet.</div>
          <div className="mt-2">Use Start to submit a request.</div>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3">Job</th>
              <th className="p-3">Status</th>
              <th className="p-3">Event</th>
              <th className="p-3">Preview</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const awaitingPreviewAt = getDetail(e.details, 'awaitingPreviewAt');
              const autoCompleteAt = awaitingPreviewAt
                ? new Date(new Date(awaitingPreviewAt).getTime() + 72 * 60 * 60 * 1000)
                : null;
              const canComplete = e.status === 'PREVIEW_READY';

              return (
                <tr key={e.id} className="border-t">
                  <td className="p-3 font-mono">{e.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3">{clientStatusLabel(e)}</td>
                  <td className="p-3">{new Date(e.eventDate).toLocaleString()} · {e.eventType}</td>
                  <td className="p-3">
                    {e.status === 'PREVIEW_READY' ? (
                      <div>
                        <div className="text-xs text-neutral-600">Auto-completes:</div>
                        <div className="text-xs font-mono">{autoCompleteAt ? autoCompleteAt.toLocaleString() : '—'}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {canComplete ? (
                      <form action="/api/client/complete" method="post">
                        <input type="hidden" name="eventId" value={e.id} />
                        <button className="rounded bg-black px-3 py-1 text-white" type="submit">
                          Mark Completed
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-neutral-500">No action</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded border p-4 text-sm text-neutral-600">
        Note: DJs have no direct contact with clients. Change requests are admin-reviewed.
      </div>

      <div className="mt-6 rounded border p-4">
        <div className="font-medium">Request changes</div>
        <p className="mt-1 text-sm text-neutral-600">Submit a change request for a job (goes to admin for approval).</p>

        {events.length > 0 ? (
          <form className="mt-3 space-y-3" action="/api/client/change-request" method="post">
            <label className="block">
              <div className="text-sm font-medium">Job</div>
              <select className="mt-1 w-full rounded border px-3 py-2" name="eventId">
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.id.slice(0, 8).toUpperCase()} — {e.eventType} ({new Date(e.eventDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-sm font-medium">What needs adjusting?</div>
              <textarea className="mt-1 w-full rounded border p-2" name="message" rows={4} placeholder="Describe the changes you want…" />
            </label>

            <button className="rounded bg-black px-4 py-2 text-white" type="submit">
              Submit change request
            </button>
          </form>
        ) : (
          <div className="mt-3 text-sm text-neutral-600">No jobs available.</div>
        )}
      </div>
    </main>
  );
}
