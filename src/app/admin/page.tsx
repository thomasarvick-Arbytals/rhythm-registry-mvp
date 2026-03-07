import { Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { requireRole } from '@/lib/require-role';

export default async function AdminHome() {
  await requireRole('admin');

  return (
    <DashboardShell
      title="Admin"
      subtitle="Governance, coupons, DJs, jobs."
      brand={{ title: 'Rhythm Registry — Admin', subtitle: 'Desktop dashboard' }}
      currentPath="/admin"
      nav={[
        { href: '/admin', label: 'Overview', code: '01' },
        { href: '/admin/jobs', label: 'Jobs', code: '02' },
        { href: '/admin/djs', label: 'DJ Approvals', code: '03' },
        { href: '/admin/coupons', label: 'Coupons', code: '04' },
        { href: '/admin/change-requests', label: 'Change Requests', code: '05' },
      ]}
      note={
        <>
          <div className="font-semibold text-[#e9ecf5]">Admin notes</div>
          <ul className="mt-2 list-disc pl-4">
            <li>Clients never see DJ identity</li>
            <li>Change requests require approval</li>
            <li>Reassignment tools coming next</li>
          </ul>
        </>
      }
      actions={<Btn href="/app">View client</Btn>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title="Quick actions" className="md:col-span-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Btn href="/admin/jobs" variant="primary">
              Jobs
            </Btn>
            <Btn href="/admin/djs">DJ approvals</Btn>
            <Btn href="/admin/coupons">Coupons</Btn>
            <Btn href="/admin/change-requests">Change requests</Btn>
          </div>
        </Card>

        <Card title="Status" className="md:col-span-12">
          <div className="text-sm text-[#aab1c6]">Admin dashboard is live. Next: pixel-match each subpage to wireframe.</div>
        </Card>
      </div>
    </DashboardShell>
  );
}
