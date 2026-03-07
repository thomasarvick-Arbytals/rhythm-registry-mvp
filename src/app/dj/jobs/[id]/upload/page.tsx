import { Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

export default async function DjUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('dj');
  const { id } = await params;

  const job = await prisma.event.findUnique({
    where: { id },
    include: { details: true, mix: true },
  });
  if (!job) return notFound();
  if (job.assignedProducerId !== session.user.id) return notFound();

  const chapters = job.details.find((d) => d.key === 'chapters')?.value ?? '';

  return (
    <DashboardShell
      title="Upload mix"
      subtitle="MVP: upload is a placeholder (no storage yet). You can still save chapters (timestamps + track names)."
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
        <Card title="Chapters" className="md:col-span-12">
          <form action="/api/dj/upload" method="post" className="space-y-3">
            <input type="hidden" name="eventId" value={job.id} />

            <div className="text-xs text-[#aab1c6]">Format: mm:ss - Track Name (one per line)</div>
            <textarea
              name="chapters"
              defaultValue={chapters}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] p-3 font-mono text-xs text-[#aab1c6]"
              rows={10}
              placeholder="00:00 - Intro\n01:32 - Song A\n04:10 - Song B"
            />

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-4 py-2 text-sm"
                type="submit"
              >
                Save chapters
              </button>
              <Btn href={`/dj/jobs/${job.id}`}>Back</Btn>
            </div>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}
