import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export default async function AdminCreators() {
  await requireAdmin();
  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { feeds: true },
  });

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 24 }}>
      <h1>Creators</h1>
      <p>Read-only MVP view (manage via DB or extend UI).</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(creators, null, 2)}</pre>
    </main>
  );
}
