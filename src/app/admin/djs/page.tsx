import { Badge, Btn, Card, DashboardShell } from '@/components/dashboard/Shell';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';

async function setDjActive(formData: FormData) {
  'use server';

  await requireRole('admin');

  const userId = String(formData.get('userId') || '');
  const approve = String(formData.get('approve') || '') === 'true';
  if (!userId) throw new Error('Missing userId');

  await prisma.producerProfile.update({
    where: { userId },
    data: { isActive: approve },
  });

  revalidatePath('/admin/djs');
}

export default async function AdminDjsPage() {
  await requireRole('admin');

  const djs = await prisma.user.findMany({
    where: { role: 'dj' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      producerProfile: { select: { isActive: true } },
    },
  });

  return (
    <DashboardShell
      title="DJ Approvals"
      subtitle="Approve DJs to receive jobs (face/ID checks paused for now)."
      brand={{ title: 'Rhythm Registry — Admin', subtitle: 'Desktop dashboard' }}
      currentPath="/admin/djs"
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
        <Card title="DJ list" className="md:col-span-12">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[rgba(15,19,32,.55)] text-xs text-[#aab1c6]">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {djs.map((r) => {
                  const isActive = r.producerProfile?.isActive ?? false;
                  return (
                    <tr key={r.id} className="border-t border-white/10">
                      <td className="p-3 font-mono">{r.email}</td>
                      <td className="p-3">
                        <Badge variant={isActive ? 'good' : 'warn'}>{isActive ? 'Approved' : 'Pending'}</Badge>
                      </td>
                      <td className="p-3 text-sm text-[#aab1c6]">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        <form action={setDjActive}>
                          <input type="hidden" name="userId" value={r.id} />
                          <input type="hidden" name="approve" value={String(!isActive)} />
                          <button
                            className="rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-1 text-sm hover:bg-[rgba(15,19,32,.75)]"
                            type="submit"
                          >
                            {isActive ? 'Deactivate' : 'Approve'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
