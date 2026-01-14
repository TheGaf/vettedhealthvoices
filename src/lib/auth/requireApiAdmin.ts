import { getServerSession } from 'next-auth';
import { authOptions } from './serverOptions';

export async function requireApiAdmin(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Response('Unauthorized', { status: 401 });
  if (!(session as any).isAdmin) throw new Response('Forbidden', { status: 403 });
  return session;
}
