import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { getIp } from '@/lib/ip';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const ip = getIp();

  const sub = await prisma.submission.findUnique({ where: { id: params.id } });
  if (!sub) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await prisma.submission.update({ where: { id: sub.id }, data: { status: 'REJECTED' } });
  await prisma.auditLog.create({
    data: {
      actorId: (session.user as any).id,
      action: 'SUBMISSION_REJECTED',
      target: sub.id,
      metadata: sub.entityType,
      ip
    }
  });

  return NextResponse.redirect(new URL('/admin', req.url));
}
