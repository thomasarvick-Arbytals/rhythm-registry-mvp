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
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Job {job.id.slice(0, 8).toUpperCase()}</h1>
      <p className="mt-2 text-sm text-neutral-600">Use the buttons below to advance progress.</p>

      <div className="mt-6 rounded border p-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div><span className="text-neutral-600">Event:</span> {job.eventType}</div>
          <div><span className="text-neutral-600">Event date:</span> {new Date(job.eventDate).toLocaleString()}</div>
          <div><span className="text-neutral-600">Hours:</span> {job.durationHours}h</div>
          <div><span className="text-neutral-600">DJ payout:</span> ${((job.order?.producerPayoutCents ?? 0) / 100).toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-6 rounded border p-4">
        <div className="font-medium">Progress</div>
        <ul className="mt-2 list-disc pl-6 text-sm">
          <li>Accepted (auto): {acceptedAt ? new Date(acceptedAt).toLocaleString() : '—'}</li>
          <li>Start (internal): {startedAt ? new Date(startedAt).toLocaleString() : '—'}</li>
          <li>Work in progress (client-visible): {wipAt ? new Date(wipAt).toLocaleString() : '—'}</li>
          <li>Awaiting preview (client-visible): {awaitingPreviewAt ? new Date(awaitingPreviewAt).toLocaleString() : '—'}</li>
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <form action="/api/dj/progress" method="post">
            <input type="hidden" name="eventId" value={job.id} />
            <input type="hidden" name="action" value="start" />
            <button className="rounded bg-black px-3 py-1 text-white" type="submit">Start</button>
          </form>
          <form action="/api/dj/progress" method="post">
            <input type="hidden" name="eventId" value={job.id} />
            <input type="hidden" name="action" value="wip" />
            <button className="rounded bg-black px-3 py-1 text-white" type="submit">Set In Progress</button>
          </form>
          <form action="/api/dj/progress" method="post">
            <input type="hidden" name="eventId" value={job.id} />
            <input type="hidden" name="action" value="awaiting_preview" />
            <button className="rounded bg-black px-3 py-1 text-white" type="submit">Set Awaiting Preview</button>
          </form>
        </div>
      </div>

      <div className="mt-6 rounded border p-4">
        <div className="font-medium">Song list / comments</div>
        <pre className="mt-2 whitespace-pre-wrap rounded border bg-white p-2 text-xs">{songList || '(none)'}</pre>
      </div>
    </main>
  );
}
