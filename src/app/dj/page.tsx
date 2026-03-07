import { Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { requireRole } from '@/lib/require-role';

export default async function DjHome() {
  await requireRole('dj');

  return (
    <DashboardShell
      title="DJ"
      subtitle="Your jobs and progress actions."
      brand={{ title: 'Rhythm Registry — DJ', subtitle: 'MVP dashboard' }}
      currentPath="/dj"
      nav={[
        { href: '/dj', label: 'Overview', code: '01' },
        { href: '/dj/queue', label: 'Job Queue', code: '02', pill: 'First-to-accept' },
        { href: '/dj/jobs', label: 'My Jobs', code: '03' },
      ]}
      note={
        <>
          <div className="font-semibold text-[#e9ecf5]">DJ rules</div>
          <ul className="mt-2 list-disc pl-4">
            <li>No client messaging</li>
            <li>First-to-accept queue</li>
            <li>Uploads are MVP placeholders</li>
          </ul>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title="Quick actions" className="md:col-span-12">
          <div className="grid gap-3 sm:grid-cols-2">
            <Btn href="/dj/queue" variant="primary">
              Job Queue
            </Btn>
            <Btn href="/dj/jobs">My Jobs</Btn>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
