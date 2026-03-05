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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Upload mix</h1>
      <p className="mt-2 text-sm text-neutral-600">
        MVP: upload is a placeholder (no storage yet). You can still save chapters (timestamps + track names).
      </p>

      <div className="mt-6 rounded border p-4">
        <form action="/api/dj/upload" method="post">
          <input type="hidden" name="eventId" value={job.id} />

          <label className="block">
            <div className="text-sm font-medium">Chapters</div>
            <div className="mt-1 text-xs text-neutral-600">Format: mm:ss - Track Name (one per line)</div>
            <textarea
              name="chapters"
              defaultValue={chapters}
              className="mt-2 w-full rounded border p-2 font-mono text-xs"
              rows={10}
              placeholder="00:00 - Intro\n01:32 - Song A\n04:10 - Song B"
            />
          </label>

          <div className="mt-4 flex gap-2">
            <button className="rounded bg-black px-4 py-2 text-white" type="submit">
              Save chapters
            </button>
            <a className="rounded border px-4 py-2 hover:bg-neutral-50" href={`/dj/jobs/${job.id}`}>
              Back
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
