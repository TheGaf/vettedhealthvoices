import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return (
      <div>
        <h1>Signed in</h1>
        <p>
          Go to <a href="/">home</a>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Sign in</h1>
      <form method="post" action="/api/auth/signin/email">
        <input type="email" name="email" placeholder="you@example.com" required />
        <button type="submit" style={{ marginLeft: 8 }}>
          Send magic link
        </button>
      </form>
    </div>
  );
}
