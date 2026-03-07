import Link from 'next/link';
import { Badge, Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

function statusVariant(status: string) {
  switch (status) {
    case 'AWAITING_ASSIGNMENT':
    case 'PLAYLIST_PENDING':
      return 'info' as const;
    case 'ASSIGNED':
      return 'good' as const;
    case 'MIXING':
    case 'REVISION_REQUESTED':
      return 'warn' as const;
    case 'PREVIEW_READY':
    case 'FINAL_DELIVERED':
    case 'PAYOUT_ELIGIBLE':
    case 'PAID_OUT':
      return 'good' as const;
    default:
      return 'info' as const;
  }
}

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
    <DashboardShell
      title="My Jobs"
      subtitle="Accepted jobs and their progress."
      brand={{ title: 'Rhythm Registry — DJ', subtitle: 'MVP dashboard' }}
      currentPath="/dj/jobs"
      nav={[
        { href: '/dj', label: 'Overview', code: '01' },
        { href: '/dj/queue', label: 'Job Queue', code: '02', pill: 'First-to-accept' },
        { href: '/dj/jobs', label: 'My Jobs', code: '03' },
      ]}
      actions={<Btn href="/dj/queue">Job Queue</Btn>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title={`Jobs (${jobs.length})`} className="md:col-span-12">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[rgba(15,19,32,.55)] text-xs text-[#aab1c6]">
                <tr>
                  <th className="p-3">Job</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Payout</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-t border-white/10">
                    <td className="p-3 font-mono">{j.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-3">
                      <Badge variant={statusVariant(j.status)}>{j.status}</Badge>
                    </td>
                    <td className="p-3">{new Date(j.eventDate).toLocaleString()} · {j.eventType}</td>
                    <td className="p-3">${((j.order?.producerPayoutCents ?? 0) / 100).toFixed(2)}</td>
                    <td className="p-3">
                      <Link
                        className="rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-3 py-1 text-sm"
                        href={`/dj/jobs/${j.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {jobs.length === 0 ? (
                  <tr>
                    <td className="p-3 text-sm text-[#aab1c6]" colSpan={5}>
                      No jobs yet.
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
