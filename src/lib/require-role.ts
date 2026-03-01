import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  return session;
}

export async function requireRole(role: 'client' | 'producer' | 'admin') {
  const session = await requireAuth();
  if (session.user.role !== role) redirect('/');
  return session;
}
