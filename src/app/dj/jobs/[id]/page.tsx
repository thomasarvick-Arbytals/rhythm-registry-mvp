import { Badge, Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

function getDetail(details: Array<{ key: string; value: string }>, key: string) {
  return details.find((d) => d.key === key)?.value ?? '';
}

export default async function DjJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('dj');
  const { id } = await params;

  const job = await prisma.event.findUnique({
    where: { id },
    include: { order: true, details: true, mix: true },
  });
  if (!job) return notFound();
  if (job.assignedProducerId !== session.user.id) return notFound();

  const acceptedAt = getDetail(job.details, 'djAcceptedAt');
  const startedAt = getDetail(job.details, 'djStartedAt');
  const wipAt = getDetail(job.details, 'djWipAt');
  const awaitingPreviewAt = getDetail(job.details, 'awaitingPreviewAt');

  const songList = getDetail(job.details, 'songList');

  return (
    <DashboardShell
      title={`Job ${job.id.slice(0, 8).toUpperCase()}`}
      subtitle="Use the buttons below to advance progress."
      brand={{ title: 'Rhythm Registry — DJ', subtitle: 'MVP dashboard' }}
      currentPath="/dj/jobs"
      nav={[
        { href: '/dj', label: 'Overview', code: '01' },
        { href: '/dj/queue', label: 'Job Queue', code: '02', pill: 'First-to-accept' },
        { href: '/dj/jobs', label: 'My Jobs', code: '03' },
      ]}
      actions={<Btn href="/dj/jobs">Back</Btn>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card title="Job details" className="md:col-span-12">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{job.eventType}</Badge>
            <Badge variant="warn">{job.durationHours}h</Badge>
            <Badge variant="good">${((job.order?.producerPayoutCents ?? 0) / 100).toFixed(2)} payout</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-[#aab1c6] sm:grid-cols-2">
            <div>
              <span className="text-[#aab1c6]">Event:</span> {job.eventType}
            </div>
            <div>
              <span className="text-[#aab1c6]">Event date:</span> {new Date(job.eventDate).toLocaleString()}
            </div>
            <div>
              <span className="text-[#aab1c6]">Hours:</span> {job.durationHours}h
            </div>
            <div>
              <span className="text-[#aab1c6]">Status:</span> {job.status}
            </div>
          </div>
        </Card>

        <Card title="Progress" className="md:col-span-12">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant={acceptedAt ? 'good' : 'info'}>Accepted</Badge>
            <Badge variant={startedAt ? 'good' : 'info'}>Started</Badge>
            <Badge variant={wipAt ? 'warn' : 'info'}>In progress</Badge>
            <Badge variant={awaitingPreviewAt ? 'purple' : 'info'}>Awaiting preview</Badge>
          </div>

          <ul className="mt-3 list-disc pl-6 text-sm text-[#aab1c6]">
            <li>Accepted (auto): {acceptedAt ? new Date(acceptedAt).toLocaleString() : '—'}</li>
            <li>Start (internal): {startedAt ? new Date(startedAt).toLocaleString() : '—'}</li>
            <li>Work in progress (client-visible): {wipAt ? new Date(wipAt).toLocaleString() : '—'}</li>
            <li>Awaiting preview (client-visible): {awaitingPreviewAt ? new Date(awaitingPreviewAt).toLocaleString() : '—'}</li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <form action="/api/dj/progress" method="post">
              <input type="hidden" name="eventId" value={job.id} />
              <input type="hidden" name="action" value="start" />
              <button className="rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-3 py-1 text-sm" type="submit">
                Start
              </button>
            </form>

            <form action="/api/dj/progress" method="post">
              <input type="hidden" name="eventId" value={job.id} />
              <input type="hidden" name="action" value="wip" />
              <button className="rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-3 py-1 text-sm" type="submit">
                Set In Progress
              </button>
            </form>

            <Btn href={`/dj/jobs/${job.id}/upload`}>Upload mix + chapters</Btn>
            <Btn href={`/dj/jobs/${job.id}/changes`}>View requested changes</Btn>

            <form action="/api/dj/progress" method="post">
              <input type="hidden" name="eventId" value={job.id} />
              <input type="hidden" name="action" value="awaiting_preview" />
              <button className="rounded-xl border border-[rgba(45,212,191,.55)] bg-[rgba(45,212,191,.12)] px-3 py-1 text-sm" type="submit">
                Set Awaiting Preview
              </button>
            </form>
          </div>
        </Card>

        <Card title="Song list / comments" className="md:col-span-12">
          <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-3 font-mono text-xs text-[#aab1c6]">
            {songList || '(none)'}
          </pre>
        </Card>
      </div>
    </DashboardShell>
  );
}
