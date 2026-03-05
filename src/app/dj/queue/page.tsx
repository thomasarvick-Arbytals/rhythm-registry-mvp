import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export default async function DjQueuePage() {
  const session = await requireRole('dj');

  const profile = await prisma.producerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isActive) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Job Queue</h1>
        <p className="mt-2 text-sm text-neutral-600">Your account is pending admin approval.</p>
      </main>
    );
  }

  const pendingCount = await prisma.event.count({
    where: {
      assignedProducerId: session.user.id,
      NOT: { status: 'PAID_OUT' },
    },
  });

  const jobs = await prisma.event.findMany({
    where: { status: 'AWAITING_ASSIGNMENT' },
    orderBy: { createdAt: 'asc' },
    include: { order: true, details: true },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Job Queue</h1>
      <p className="mt-2 text-sm text-neutral-600">First-to-accept wins. Pending jobs: {pendingCount}/2</p>

      <div className="mt-6 overflow-hidden rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3">Job</th>
              <th className="p-3">Hours</th>
              <th className="p-3">Event</th>
              <th className="p-3">Vibe</th>
              <th className="p-3">Song list</th>
              <th className="p-3">DJ payout</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const songList = j.details.find((d) => d.key === 'songList')?.value ?? '';
              return (
                <tr key={j.id} className="border-t">
                  <td className="p-3 font-mono">{j.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3">{j.durationHours}h</td>
                  <td className="p-3">
                    {new Date(j.eventDate).toLocaleString()} · {j.eventType}
                  </td>
                  <td className="p-3">{j.vibeTags.join(', ')}</td>
                  <td className="p-3">
                    <details>
                      <summary className="cursor-pointer text-blue-700">View</summary>
                      <pre className="mt-2 whitespace-pre-wrap rounded border bg-white p-2 text-xs">{songList || '(none)'}</pre>
                    </details>
                  </td>
                  <td className="p-3">${((j.order?.producerPayoutCents ?? 0) / 100).toFixed(2)}</td>
                  <td className="p-3">
                    <form action="/api/dj/accept" method="post">
                      <input type="hidden" name="eventId" value={j.id} />
                      <button
                        className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
                        disabled={pendingCount >= 2}
                        type="submit"
                      >
                        Accept
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
