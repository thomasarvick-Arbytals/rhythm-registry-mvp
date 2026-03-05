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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">DJ Approvals</h1>
      <p className="mt-2 text-sm text-neutral-600">Approve DJs to receive jobs (face/ID checks paused for now).</p>

      <div className="mt-6 overflow-hidden rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Active</th>
              <th className="p-3">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {djs.map((r) => {
              const isActive = r.producerProfile?.isActive ?? false;
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono">{r.email}</td>
                  <td className="p-3">{isActive ? 'Approved' : 'Pending'}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <form action={setDjActive}>
                      <input type="hidden" name="userId" value={r.id} />
                      <input type="hidden" name="approve" value={String(!isActive)} />
                      <button className="rounded border px-3 py-1 hover:bg-neutral-50" type="submit">
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
    </main>
  );
}
