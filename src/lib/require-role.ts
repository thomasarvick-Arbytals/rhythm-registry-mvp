import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

type SessionLike = { user?: { id?: string; role?: string; email?: string } };

export async function requireAuth() {
  const session = (await getServerSession(authOptions as any)) as SessionLike | null;
  if (!session?.user) redirect('/login');
  return session;
}

export async function requireRole(role: 'client' | 'dj' | 'admin') {
  const session = await requireAuth();
  if (session.user?.role !== role) redirect('/');
  return session as { user: { id: string; role: typeof role; email?: string } };
}
