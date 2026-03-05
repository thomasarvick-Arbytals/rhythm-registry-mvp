import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function decide(formData: FormData) {
  'use server';

  await requireRole('admin');

  const eventId = String(formData.get('eventId') || '');
  const decision = String(formData.get('decision') || '');
  const adminNote = String(formData.get('adminNote') || '').trim();

  if (!eventId) throw new Error('Missing eventId');
  if (!['approve', 'reject'].includes(decision)) throw new Error('Invalid decision');

  const now = new Date().toISOString();

  if (decision === 'approve') {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId, key: 'changeRequestApprovedAt' } },
      update: { value: now },
      create: { eventId, key: 'changeRequestApprovedAt', value: now },
    });
    if (adminNote) {
      await prisma.eventDetail.upsert({
        where: { eventId_key: { eventId, key: 'changeRequestAdminNote' } },
        update: { value: adminNote },
        create: { eventId, key: 'changeRequestAdminNote', value: adminNote },
      });
    }
    await prisma.event.update({ where: { id: eventId }, data: { status: 'MIXING' } });
  }

  if (decision === 'reject') {
    await prisma.eventDetail.upsert({
      where: { eventId_key: { eventId, key: 'changeRequestRejectedAt' } },
      update: { value: now },
      create: { eventId, key: 'changeRequestRejectedAt', value: now },
    });
    if (adminNote) {
      await prisma.eventDetail.upsert({
        where: { eventId_key: { eventId, key: 'changeRequestAdminNote' } },
        update: { value: adminNote },
        create: { eventId, key: 'changeRequestAdminNote', value: adminNote },
      });
    }
    await prisma.event.update({ where: { id: eventId }, data: { status: 'PREVIEW_READY' } });
  }

  revalidatePath('/admin/change-requests');
}

export default async function AdminChangeRequestsPage() {
  await requireRole('admin');

  const events = await prisma.event.findMany({
    where: { status: 'REVISION_REQUESTED' },
    orderBy: { createdAt: 'desc' },
    include: { details: true, assignedProducer: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Change Requests</h1>
      <p className="mt-2 text-sm text-neutral-600">Client requests are admin-gated. Approve to send to DJ.</p>

      <div className="mt-6 overflow-hidden rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3">Job</th>
              <th className="p-3">Event</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">DJ</th>
              <th className="p-3">Message</th>
              <th className="p-3">Admin note</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const message = e.details.find((d) => d.key === 'changeRequestMessage')?.value ?? '';
              const submittedAt = e.details.find((d) => d.key === 'changeRequestSubmittedAt')?.value ?? '';

              return (
                <tr key={e.id} className="border-t">
                  <td className="p-3 font-mono">{e.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3">{new Date(e.eventDate).toLocaleString()} · {e.eventType}</td>
                  <td className="p-3">{submittedAt ? new Date(submittedAt).toLocaleString() : '—'}</td>
                  <td className="p-3">{e.assignedProducer?.email ?? '—'}</td>
                  <td className="p-3"><pre className="whitespace-pre-wrap text-xs">{message}</pre></td>
                  <td className="p-3">
                    <form action={decide} className="flex flex-col gap-2">
                      <input type="hidden" name="eventId" value={e.id} />
                      <input className="w-64 rounded border px-2 py-1 text-xs" name="adminNote" placeholder="Optional note" />
                      <div className="flex gap-2">
                        <button className="rounded bg-black px-3 py-1 text-white" name="decision" value="approve" type="submit">Approve</button>
                        <button className="rounded border px-3 py-1" name="decision" value="reject" type="submit">Reject</button>
                      </div>
                    </form>
                  </td>
                  <td className="p-3"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
