import { prisma } from '../src/lib/prisma';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) throw new Error('ADMIN_EMAIL is required');

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { isAdmin: true },
    create: { email: adminEmail, isAdmin: true, name: 'Admin' },
  });

  const domain = await prisma.domain.upsert({
    where: { host: 'example.com' },
    update: {},
    create: { host: 'example.com' },
  });

  const creator = await prisma.creator.create({
    data: {
      name: 'Example Creator',
      description: 'Sample creator used for local testing.',
      primaryDomain: 'example.com',
      domainId: domain.id,
      feeds: {
        create: [
          { url: 'https://example.com/feed.xml', type: 'rss', enabled: false, domainId: domain.id },
          { url: 'https://example.com/sitemap.xml', type: 'sitemap', enabled: false, domainId: domain.id },
        ],
      },
    },
  });

  await prisma.domainBlocklist.upsert({
    where: { host: 'badexample.com' },
    update: {},
    create: { host: 'badexample.com', reason: 'Example blocklisted domain', createdBy: admin.id },
  });

  await prisma.keywordBlocklist.upsert({
    where: { keyword: 'miracle cure' },
    update: {},
    create: { keyword: 'miracle cure', reason: 'Example keyword', createdBy: admin.id },
  });

  console.log({ admin: admin.email, creator: creator.name });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
