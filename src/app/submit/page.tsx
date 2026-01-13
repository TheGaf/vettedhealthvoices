import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function SubmitPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div>
        <h1>Submit</h1>
        <p>
          You must <a href="/auth/signin">sign in</a> to submit.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Submit</h1>
      <p>Submissions are reviewed by moderators.</p>
      <form method="post" action="/api/submissions">
        <label>
          Type
          <select name="entityType" defaultValue="ORG">
            <option value="ORG">Organization</option>
            <option value="PERSON">Person</option>
          </select>
        </label>
        <div style={{ marginTop: 8 }}>
          <textarea name="payloadJson" rows={10} style={{ width: '100%', maxWidth: 720 }} placeholder='{"name":"..."}' />
        </div>
        <button style={{ marginTop: 8 }} type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}
