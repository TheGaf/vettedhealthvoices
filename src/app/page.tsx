import Link from 'next/link';

async function search(q: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/search?q=${encodeURIComponent(q)}`, {
    cache: 'no-store'
  });
  if (!res.ok) return { orgs: [], people: [] };
  return res.json();
}

export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q || '';
  const results = q ? await search(q) : { orgs: [], people: [] };

  return (
    <div>
      <h1>Health Trust Directory</h1>
      <form method="get" action="/">
        <input name="q" placeholder="Search organizations and people" defaultValue={q} style={{ width: '100%', maxWidth: 520 }} />
      </form>

      {q ? (
        <div style={{ marginTop: 16 }}>
          <h2>Organizations</h2>
          <ul>
            {results.orgs.map((o: any) => (
              <li key={o.id}>
                <Link href={`/orgs/${o.slug}`}>{o.name}</Link>
              </li>
            ))}
            {results.orgs.length === 0 ? <li>No organizations found.</li> : null}
          </ul>

          <h2>People</h2>
          <ul>
            {results.people.map((p: any) => (
              <li key={p.id}>
                <Link href={`/people/${p.id}`}>{p.name}</Link>
              </li>
            ))}
            {results.people.length === 0 ? <li>No people found.</li> : null}
          </ul>
        </div>
      ) : (
        <p style={{ marginTop: 16 }}>Type a query to search.</p>
      )}
    </div>
  );
}
