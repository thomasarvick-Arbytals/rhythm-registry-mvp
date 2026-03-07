import { Badge, Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export default async function DjChangesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('dj');
  const { id } = await params;

  const job = await prisma.event.findUnique({ where: { id }, include: { details: true } });
  if (!job) return notFound();
  if (job.assignedProducerId !== session.user.id) return notFound();

  const approvedAt = job.details.find((d) => d.key === 'changeRequestApprovedAt')?.value ?? '';
  const message = job.details.find((d) => d.key === 'changeRequestMessage')?.value ?? '';
  const adminNote = job.details.find((d) => d.key === 'changeRequestAdminNote')?.value ?? '';

  const visible = job.status === 'MIXING' && approvedAt;

  return (
    <DashboardShell
      title="Requested changes"
      subtitle={visible ? `Admin approved changes at ${new Date(approvedAt).toLocaleString()}.` : 'No admin-approved change requests for this job yet.'}
      brand={{ title: 'Rhythm Registry — DJ', subtitle: 'MVP dashboard' }}
      currentPath="/dj/jobs"
      nav={[
        { href: '/dj', label: 'Overview', code: '01' },
        { href: '/dj/queue', label: 'Job Queue', code: '02', pill: 'First-to-accept' },
        { href: '/dj/jobs', label: 'My Jobs', code: '03' },
      ]}
      actions={<Btn href={`/dj/jobs/${job.id}`}>Back</Btn>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title="Status" className="md:col-span-12">
          <div className="flex flex-wrap gap-2">
            <Badge variant={visible ? 'good' : 'warn'}>{visible ? 'Approved' : 'None'}</Badge>
            <Badge variant="info">Admin-gated</Badge>
          </div>
        </Card>

        {visible ? (
          <Card title="Client request" className="md:col-span-12">
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-3 font-mono text-xs text-[#aab1c6]">
              {message}
            </pre>

            {adminNote ? (
              <>
                <div className="mt-4 text-sm font-medium">Admin note</div>
                <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-3 font-mono text-xs text-[#aab1c6]">
                  {adminNote}
                </pre>
              </>
            ) : null}
          </Card>
        ) : (
          <Card title="No changes" className="md:col-span-12">
            <div className="text-sm text-[#aab1c6]">Nothing to show yet.</div>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
