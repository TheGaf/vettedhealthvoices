import { getServerSession } from 'next-auth';
import { authOptions } from './serverOptions';

export async function requireApiUser(_req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session;
}
