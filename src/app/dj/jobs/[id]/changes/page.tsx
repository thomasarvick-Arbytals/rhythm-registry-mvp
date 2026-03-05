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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Requested changes</h1>
      {!visible ? (
        <p className="mt-2 text-sm text-neutral-600">No admin-approved change requests for this job yet.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-neutral-600">Admin approved changes at {new Date(approvedAt).toLocaleString()}.</p>
          <div className="mt-6 rounded border p-4">
            <div className="text-sm font-medium">Client request</div>
            <pre className="mt-2 whitespace-pre-wrap rounded border bg-white p-2 text-xs">{message}</pre>

            {adminNote ? (
              <>
                <div className="mt-4 text-sm font-medium">Admin note</div>
                <pre className="mt-2 whitespace-pre-wrap rounded border bg-white p-2 text-xs">{adminNote}</pre>
              </>
            ) : null}
          </div>
        </>
      )}

      <div className="mt-6">
        <a className="rounded border px-4 py-2 hover:bg-neutral-50" href={`/dj/jobs/${job.id}`}>
          Back
        </a>
      </div>
    </main>
  );
}
