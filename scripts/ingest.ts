import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

type Input = {
  organizations?: Array<{
    slug?: string;
    name: string;
    description?: string;
    website?: string;
    city?: string;
    state?: string;
    country?: string;
    tags?: string[];
    people?: Array<{
      name: string;
      title?: string;
      bio?: string;
      email?: string;
      website?: string;
    }>;
  }>;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function main() {
  const file = process.env.INGEST_FILE || path.join(process.cwd(), 'scripts', 'data', 'sample.json');
  const raw = fs.readFileSync(file, 'utf8');
  const input = JSON.parse(raw) as Input;

  const orgs = input.organizations || [];
  for (const o of orgs) {
    const slug = o.slug || slugify(o.name);
    const org = await prisma.organization.upsert({
      where: { slug },
      update: {
        name: o.name,
        description: o.description,
        website: o.website,
        city: o.city,
        state: o.state,
        country: o.country,
        tags: o.tags?.join(',')
      },
      create: {
        slug,
        name: o.name,
        description: o.description,
        website: o.website,
        city: o.city,
        state: o.state,
        country: o.country,
        tags: o.tags?.join(',')
      }
    });

    for (const p of o.people || []) {
      await prisma.person.create({
        data: {
          name: p.name,
          title: p.title,
          bio: p.bio,
          email: p.email,
          website: p.website,
          orgId: org.id
        }
      });
    }
  }

  console.log(`Ingested ${orgs.length} org(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
