import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function OrgPage({ params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: { people: true }
  });

  if (!org) return <div>Not found</div>;

  return (
    <div>
      <h1>{org.name}</h1>
      {org.description ? <p>{org.description}</p> : null}
      {org.website ? (
        <p>
          <a href={org.website} rel="noreferrer" target="_blank">
            {org.website}
          </a>
        </p>
      ) : null}

      <h2>People</h2>
      <ul>
        {org.people.map((p) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`}>{p.name}</Link>
          </li>
        ))}
        {org.people.length === 0 ? <li>No people listed.</li> : null}
      </ul>
    </div>
  );
}
