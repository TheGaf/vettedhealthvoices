import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { getIp } from '@/lib/ip';

export async function GET(req: Request) {
  const ip = getIp();
  const rl = rateLimit(`search:${ip}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ orgs: [], people: [] });

  // FTS5 search using raw SQL
  const orgs = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.id, o.slug, o.name
     FROM OrgFts f
     JOIN Organization o ON o.id = f.orgId
     WHERE OrgFts MATCH ?
     LIMIT 20`,
    q + '*'
  );

  const people = await prisma.$queryRawUnsafe<any[]>(
    `SELECT p.id, p.name
     FROM PersonFts f
     JOIN Person p ON p.id = f.personId
     WHERE PersonFts MATCH ?
     LIMIT 20`,
    q + '*'
  );

  return NextResponse.json({ orgs, people });
}
