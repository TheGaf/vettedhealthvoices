import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './serverOptions';

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/api/auth/signin');
  return session;
}
