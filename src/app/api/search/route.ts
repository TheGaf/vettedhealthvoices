import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth/requireApiUser';
import { rateLimit } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  await requireApiUser(req);
  rateLimit(req, { limit: 30, windowMs: 60_000 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (!q) return NextResponse.json({ creators: [], items: [] });

  // Use raw FTS for speed
  const creators = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.id, c.name, c.primaryDomain, c.description
     FROM CreatorFts f
     JOIN Creator c ON c.id = f.creatorId
     WHERE CreatorFts MATCH ?
     ORDER BY bm25(CreatorFts) ASC
     LIMIT 20`,
    q,
  );

  const items = await prisma.$queryRawUnsafe<any[]>(
    `SELECT i.id, i.title, i.canonicalUrl, i.excerpt, i.publishedAt, i.creatorId
     FROM ItemFts f
     JOIN Item i ON i.id = f.itemId
     WHERE ItemFts MATCH ?
     ORDER BY bm25(ItemFts) ASC
     LIMIT 50`,
    q,
  );

  return NextResponse.json({ creators, items });
}
