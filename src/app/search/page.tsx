import { requireUser } from '@/lib/auth/requireUser';

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  await requireUser();
  const q = (searchParams?.q ?? '').trim();

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 24 }}>
      <h1>Search</h1>
      <form method="GET" action="/search" style={{ display: 'flex', gap: 8 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search creators and items"
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit">Search</button>
      </form>
      {q ? (
        <>
          <h2 style={{ marginTop: 24 }}>Results</h2>
          <p>
            Use <code>/api/search?q=...</code> for structured results.
          </p>
        </>
      ) : (
        <p style={{ marginTop: 24 }}>Enter a query.</p>
      )}
    </main>
  );
}
