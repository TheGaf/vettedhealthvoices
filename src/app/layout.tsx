import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Trust Directory (MVP)',
  description: 'Auth-gated directory with ingestion and FTS search.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex,nofollow,noarchive,nosnippet" />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
        {children}
      </body>
    </html>
  );
}
