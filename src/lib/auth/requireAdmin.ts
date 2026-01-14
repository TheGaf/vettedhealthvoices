import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './serverOptions';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session as any)?.isAdmin;
  if (!session?.user) redirect('/api/auth/signin');
  if (!isAdmin) redirect('/');
  return session;
}
