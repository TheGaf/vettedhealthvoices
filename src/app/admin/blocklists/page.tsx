import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export default async function AdminBlocklists() {
  await requireAdmin();
  const domains = await prisma.domainBlocklist.findMany({ orderBy: { createdAt: 'desc' } });
  const keywords = await prisma.keywordBlocklist.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 24 }}>
      <h1>Blocklists</h1>
      <h2>DomainBlocklist</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(domains, null, 2)}</pre>
      <h2>KeywordBlocklist</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(keywords, null, 2)}</pre>
    </main>
  );
}
