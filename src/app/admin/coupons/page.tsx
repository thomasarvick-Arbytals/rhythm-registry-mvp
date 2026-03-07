import { Btn, Card, DashboardShell, Badge } from '@/components/dashboard/Shell';
import { requireRole } from '@/lib/require-role';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function createCoupon(formData: FormData) {
  'use server';

  await requireRole('admin');

  const code = String(formData.get('code') || '')
    .trim()
    .toUpperCase();
  const percentOff = Number(formData.get('percentOff') || 0);

  if (!code) throw new Error('Missing code');
  if (Number.isNaN(percentOff) || percentOff < 0 || percentOff > 100) throw new Error('Invalid percent');

  await prisma.coupon.upsert({
    where: { code },
    update: { percentOff, isActive: true },
    create: { code, percentOff, isActive: true },
  });

  revalidatePath('/admin/coupons');
}

async function toggleCoupon(formData: FormData) {
  'use server';

  await requireRole('admin');

  const id = String(formData.get('id') || '').trim();
  const isActive = String(formData.get('isActive') || '') === 'true';
  if (!id) throw new Error('Missing id');

  await prisma.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath('/admin/coupons');
}

export default async function AdminCouponsPage() {
  await requireRole('admin');

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <DashboardShell
      title="Coupons"
      subtitle="Create coupons for testing checkout without Stripe (admin-only)."
      brand={{ title: 'Rhythm Registry — Admin', subtitle: 'Desktop dashboard' }}
      currentPath="/admin/coupons"
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
        <Card title="Create coupon" className="md:col-span-12">
          <form action={createCoupon} className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <div className="text-sm font-medium">Code</div>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-sm"
                name="code"
                placeholder="TESTING"
                required
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium">% off</div>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-2 text-sm"
                name="percentOff"
                type="number"
                min={0}
                max={100}
                defaultValue={100}
                required
              />
            </label>

            <div className="flex items-end">
              <button
                className="w-full rounded-xl border border-[rgba(96,165,250,.6)] bg-[rgba(96,165,250,.15)] px-4 py-2 text-sm"
                type="submit"
              >
                Create / Update
              </button>
            </div>
          </form>
        </Card>

        <Card title={`Coupons (${coupons.length})`} className="md:col-span-12">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[rgba(15,19,32,.55)] text-xs text-[#aab1c6]">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">% off</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-white/10">
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3">{c.percentOff}%</td>
                    <td className="p-3">
                      <Badge variant={c.isActive ? 'good' : 'warn'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="p-3">
                      <form action={toggleCoupon}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="isActive" value={String(!c.isActive)} />
                        <button
                          className="rounded-xl border border-white/10 bg-[rgba(15,19,32,.55)] px-3 py-1 text-sm hover:bg-[rgba(15,19,32,.75)]"
                          type="submit"
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}

                {coupons.length === 0 ? (
                  <tr>
                    <td className="p-3 text-sm text-[#aab1c6]" colSpan={4}>
                      No coupons yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Notes" className="md:col-span-12">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">Coupons apply in API (not Stripe)</Badge>
            <Badge variant="good">100% off bypasses Stripe</Badge>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
