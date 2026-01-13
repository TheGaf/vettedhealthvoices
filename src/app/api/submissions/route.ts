import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { getIp } from '@/lib/ip';

const schema = z.object({
  entityType: z.enum(['ORG', 'PERSON']),
  payloadJson: z.string().min(2)
});

export async function POST(req: Request) {
  const ip = getIp();
  const rl = rateLimit(`submit:${ip}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const parsed = schema.safeParse({
    entityType: form.get('entityType'),
    payloadJson: form.get('payloadJson')
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const created = await prisma.submission.create({
    data: {
      entityType: parsed.data.entityType,
      payloadJson: parsed.data.payloadJson,
      createdById: (session.user as any).id
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: (session.user as any).id,
      action: 'SUBMISSION_CREATED',
      target: created.id,
      ip
    }
  });

  return NextResponse.redirect(new URL('/submit', req.url));
}
