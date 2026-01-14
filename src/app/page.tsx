import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 860, margin: '40px auto', padding: 24 }}>
      <h1>Health Trust Directory (MVP)</h1>
      <p>
        This MVP is intentionally private. Search and APIs are auth-gated. All pages
        are noindex.
      </p>
      <ul>
        <li>
          <Link href="/search">Search</Link>
        </li>
        <li>
          <Link href="/admin">Admin</Link>
        </li>
        <li>
          <Link href="/api/auth/signin">Sign in</Link>
        </li>
      </ul>
    </main>
  );
}
