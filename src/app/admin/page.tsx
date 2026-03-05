import Link from 'next/link';
import { requireRole } from '@/lib/require-role';

export default async function AdminHome() {
  await requireRole('admin');

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="mt-2 text-sm text-neutral-600">Governance, coupons, DJs, jobs.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link className="rounded border p-4 hover:bg-neutral-50" href="/admin/coupons">
          <div className="font-medium">Coupons</div>
          <div className="text-sm text-neutral-600">Create & manage coupon codes</div>
        </Link>
        <Link className="rounded border p-4 hover:bg-neutral-50" href="/admin/djs">
          <div className="font-medium">DJ Approvals</div>
          <div className="text-sm text-neutral-600">Approve DJs to receive jobs</div>
        </Link>
        <Link className="rounded border p-4 hover:bg-neutral-50" href="/admin/jobs">
          <div className="font-medium">Jobs</div>
          <div className="text-sm text-neutral-600">Monitor jobs & reassignment</div>
        </Link>
      </div>
    </main>
  );
}
