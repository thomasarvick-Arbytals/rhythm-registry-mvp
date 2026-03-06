import { requireAuth } from '@/lib/require-role';
import { redirect } from 'next/navigation';

export default async function RouterPage() {
  const session = await requireAuth();
  const role = session.user?.role;
  if (role === 'admin') redirect('/admin');
  if (role === 'dj') redirect('/dj');
  redirect('/app');
}
