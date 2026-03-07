import { Badge, Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export default async function DjQueuePage() {
  const session = await requireRole('dj');

  const profile = await prisma.producerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.isActive) {
    return (
      <DashboardShell
        title="Job Queue"
        subtitle="Your account is pending admin approval."
        brand={{ title: 'Rhythm Registry — DJ', subtitle: 'MVP dashboard' }}
        currentPath="/dj/queue"
        nav={[
          { href: '/dj', label: 'Overview', code: '01' },
          { href: '/dj/queue', label: 'Job Queue', code: '02', pill: 'First-to-accept' },
          { href: '/dj/jobs', label: 'My Jobs', code: '03' },
        ]}
        actions={<Btn href="/dj">Back</Btn>}
      >
        <Card title="Status" className="md:col-span-12">
          <div className="text-sm text-[#aab1c6]">Your account is pending admin approval.</div>
        </Card>
      </DashboardShell>
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
    <DashboardShell
      title="Job Queue"
      subtitle={`First-to-accept wins. Pending jobs: ${pendingCount}/2`}
      brand={{ title: 'Rhythm Registry — DJ', subtitle: 'MVP dashboard' }}
      currentPath="/dj/queue"
      nav={[
        { href: '/dj', label: 'Overview', code: '01' },
        { href: '/dj/queue', label: 'Job Queue', code: '02', pill: 'First-to-accept' },
        { href: '/dj/jobs', label: 'My Jobs', code: '03' },
      ]}
      actions={<Btn href="/dj/jobs">My Jobs</Btn>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title="Queue" className="md:col-span-12">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#aab1c6]">
            <Badge variant={pendingCount >= 2 ? 'warn' : 'good'}>Capacity: {pendingCount}/2</Badge>
            <Badge variant="info">First-to-accept</Badge>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[rgba(15,19,32,.55)] text-xs text-[#aab1c6]">
                <tr>
                  <th className="p-3">Job</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Vibe</th>
                  <th className="p-3">Song list</th>
                  <th className="p-3">DJ payout</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const songList = j.details.find((d) => d.key === 'songList')?.value ?? '';
                  return (
                    <tr key={j.id} className="border-t border-white/10">
                      <td className="p-3 font-mono">{j.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3">{j.durationHours}h</td>
                      <td className="p-3">{new Date(j.eventDate).toLocaleString()} · {j.eventType}</td>
                      <td className="p-3 text-sm text-[#aab1c6]">{j.vibeTags.join(', ')}</td>
                      <td className="p-3">
                        <details>
                          <summary className="cursor-pointer text-sm text-[#dbeafe]">View</summary>
                          <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-2 font-mono text-xs text-[#aab1c6]">
                            {songList || '(none)'}
                          </pre>
                        </details>
                      </td>
                      <td className="p-3">${((j.order?.producerPayoutCents ?? 0) / 100).toFixed(2)}</td>
                      <td className="p-3">
                        <form action="/api/dj/accept" method="post">
                          <input type="hidden" name="eventId" value={j.id} />
                          <button
                            className="rounded-xl border border-[rgba(45,212,191,.55)] bg-[rgba(45,212,191,.12)] px-3 py-1 text-sm disabled:opacity-50"
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

                {jobs.length === 0 ? (
                  <tr>
                    <td className="p-3 text-sm text-[#aab1c6]" colSpan={7}>
                      No available jobs right now.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
