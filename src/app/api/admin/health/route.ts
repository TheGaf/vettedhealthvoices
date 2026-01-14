import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/auth/requireApiAdmin';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: Request) {
  await requireApiAdmin(req);
  rateLimit(req, { limit: 15, windowMs: 60_000 });
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
