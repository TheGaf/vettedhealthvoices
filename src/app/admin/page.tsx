import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export default async function AdminHome() {
  await requireAdmin();
  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 24 }}>
      <h1>Admin</h1>
      <ul>
        <li>
          <Link href="/admin/creators">Creators</Link>
        </li>
        <li>
          <Link href="/admin/blocklists">Blocklists</Link>
        </li>
        <li>
          <Link href="/api/admin/health">Admin health (API)</Link>
        </li>
      </ul>
    </main>
  );
}
