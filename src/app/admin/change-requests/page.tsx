import { Badge, Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
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
    <DashboardShell
      title="Change Requests"
      subtitle="Client requests are admin-gated. Approve to send to DJ."
      brand={{ title: 'Rhythm Registry — Admin', subtitle: 'Desktop dashboard' }}
      currentPath="/admin/change-requests"
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
        <Card title={`Pending change requests (${events.length})`} className="md:col-span-12">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[rgba(15,19,32,.55)] text-xs text-[#aab1c6]">
                <tr>
                  <th className="p-3">Job</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">DJ</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Decision</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const message = e.details.find((d) => d.key === 'changeRequestMessage')?.value ?? '';
                  const submittedAt = e.details.find((d) => d.key === 'changeRequestSubmittedAt')?.value ?? '';

                  return (
                    <tr key={e.id} className="border-t border-white/10">
                      <td className="p-3 font-mono">{e.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3">{new Date(e.eventDate).toLocaleString()} · {e.eventType}</td>
                      <td className="p-3 text-sm text-[#aab1c6]">{submittedAt ? new Date(submittedAt).toLocaleString() : '—'}</td>
                      <td className="p-3">{e.assignedProducer?.email ?? '—'}</td>
                      <td className="p-3">
                        <pre className="whitespace-pre-wrap text-xs text-[#aab1c6]">{message}</pre>
                      </td>
                      <td className="p-3">
                        <form action={decide} className="flex flex-col gap-2">
                          <input type="hidden" name="eventId" value={e.id} />
                          <input
                            className="w-64 rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-xs"
                            name="adminNote"
                            placeholder="Optional note"
                          />
                          <div className="flex gap-2">
                            <button
                              className="rounded-xl border border-[rgba(45,212,191,.55)] bg-[rgba(45,212,191,.12)] px-3 py-1 text-sm"
                              name="decision"
                              value="approve"
                              type="submit"
                            >
                              Approve
                            </button>
                            <button
                              className="rounded-xl border border-[rgba(251,113,133,.55)] bg-[rgba(251,113,133,.10)] px-3 py-1 text-sm"
                              name="decision"
                              value="reject"
                              type="submit"
                            >
                              Reject
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                })}

                {events.length === 0 ? (
                  <tr>
                    <td className="p-3 text-sm text-[#aab1c6]" colSpan={6}>
                      No pending change requests.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Policy" className="md:col-span-12">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Admin-gated</Badge>
            <Badge variant="warn">No direct client ↔ DJ comms</Badge>
            <Badge variant="good">Approve → Mixing</Badge>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
