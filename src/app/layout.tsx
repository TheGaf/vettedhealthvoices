import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Health Trust Directory',
  description: 'Vetted Health Voices',
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body>
        <header style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <a href="/">Health Trust Directory</a>
          <span style={{ marginLeft: 12 }}>
            <a href="/submit">Submit</a>
          </span>
          <span style={{ marginLeft: 12 }}>
            <a href="/admin">Admin</a>
          </span>
          <span style={{ float: 'right' }}>
            <a href="/auth/signin">Sign in</a>
          </span>
        </header>
        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}
