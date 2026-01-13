import { prisma } from '../src/lib/prisma';

async function main() {
  // create admin if ADMIN_EMAIL set
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' },
      create: { email: adminEmail, role: 'ADMIN' }
    });
    console.log(`Ensured admin user: ${adminEmail}`);
  } else {
    console.log('ADMIN_EMAIL not set; no admin user created.');
  }

  // sample data
  const org = await prisma.organization.upsert({
    where: { slug: 'sample-health-org' },
    update: {},
    create: {
      slug: 'sample-health-org',
      name: 'Sample Health Org',
      description: 'Example organization in the directory.',
      website: 'https://example.com',
      city: 'New York',
      state: 'NY',
      tags: 'care,community'
    }
  });

  await prisma.person.create({
    data: {
      name: 'Sample Person',
      title: 'Health Advocate',
      bio: 'Example person profile.',
      orgId: org.id
    }
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
