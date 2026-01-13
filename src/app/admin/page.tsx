import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  await requireAdmin();
  const pending = await prisma.submission.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return (
    <div>
      <h1>Admin</h1>
      <h2>Pending submissions</h2>
      <ul>
        {pending.map((s) => (
          <li key={s.id}>
            <div>
              <code>{s.entityType}</code> — {new Date(s.createdAt).toISOString()}
            </div>
            <form method="post" action={`/api/admin/submissions/${s.id}/approve`} style={{ display: 'inline' }}>
              <button type="submit">Approve</button>
            </form>
            <form method="post" action={`/api/admin/submissions/${s.id}/reject`} style={{ display: 'inline', marginLeft: 8 }}>
              <button type="submit">Reject</button>
            </form>
          </li>
        ))}
        {pending.length === 0 ? <li>No pending submissions.</li> : null}
      </ul>
    </div>
  );
}
