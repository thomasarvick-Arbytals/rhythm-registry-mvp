import { Badge, Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
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
    <DashboardShell
      title="Jobs"
      subtitle="Monitor jobs and (soon) reassign DJs."
      brand={{ title: 'Rhythm Registry — Admin', subtitle: 'Desktop dashboard' }}
      currentPath="/admin/jobs"
      nav={[
        { href: '/admin', label: 'Overview', code: '01' },
        { href: '/admin/jobs', label: 'Jobs', code: '02' },
        { href: '/admin/djs', label: 'DJ Approvals', code: '03' },
        { href: '/admin/coupons', label: 'Coupons', code: '04' },
        { href: '/admin/change-requests', label: 'Change Requests', code: '05' },
      ]}
      actions={<Btn href="/admin">Back</Btn>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title="Latest jobs" className="md:col-span-12">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[rgba(15,19,32,.55)] text-xs text-[#aab1c6]">
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
                  <tr key={e.id} className="border-t border-white/10">
                    <td className="p-3 font-mono">{e.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-3">
                      <Badge variant={e.status === 'REVISION_REQUESTED' ? 'warn' : e.status === 'PAID_OUT' ? 'good' : 'info'}>
                        {statusLabel(e.status)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{e.client?.name || '—'}</div>
                      <div className="text-xs text-[#aab1c6]">{e.client?.email || ''}</div>
                    </td>
                    <td className="p-3">
                      {new Date(e.eventDate).toLocaleString()} · {e.eventType}
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-[#aab1c6]">{e.order?.paymentStatus || '—'}</span>
                    </td>
                  </tr>
                ))}

                {events.length === 0 ? (
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

        <Card title="Reassignment" className="md:col-span-12">
          <div className="text-sm text-[#aab1c6]">Reassignment tools coming next: force unassign, re-run assignment, and view producer queue.</div>
        </Card>
      </div>
    </DashboardShell>
  );
}
