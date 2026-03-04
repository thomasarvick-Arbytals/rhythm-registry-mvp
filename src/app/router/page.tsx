import { requireAuth } from '@/lib/require-role';
import { redirect } from 'next/navigation';

export default async function RouterPage() {
  const session = await requireAuth();
  if (session.user.role === 'admin') redirect('/admin');
  if (session.user.role === 'dj') redirect('/dj');
  redirect('/app');
}
