import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { getIp } from '@/lib/ip';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const ip = getIp();

  const sub = await prisma.submission.findUnique({ where: { id: params.id } });
  if (!sub) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const payload = JSON.parse(sub.payloadJson);

  if (sub.entityType === 'ORG') {
    const slug = String(payload.slug || payload.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await prisma.organization.create({
      data: {
        slug,
        name: payload.name,
        description: payload.description,
        website: payload.website,
        city: payload.city,
        state: payload.state,
        country: payload.country,
        tags: Array.isArray(payload.tags) ? payload.tags.join(',') : payload.tags
      }
    });
  } else {
    await prisma.person.create({
      data: {
        name: payload.name,
        title: payload.title,
        bio: payload.bio,
        website: payload.website,
        email: payload.email
      }
    });
  }

  await prisma.submission.update({ where: { id: sub.id }, data: { status: 'APPROVED' } });
  await prisma.auditLog.create({
    data: {
      actorId: (session.user as any).id,
      action: 'SUBMISSION_APPROVED',
      target: sub.id,
      metadata: sub.entityType,
      ip
    }
  });

  return NextResponse.redirect(new URL('/admin', req.url));
}
