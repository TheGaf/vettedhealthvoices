import { prisma } from '@/lib/prisma';

export default async function PersonPage({ params }: { params: { id: string } }) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: { organization: true }
  });

  if (!person) return <div>Not found</div>;

  return (
    <div>
      <h1>{person.name}</h1>
      {person.title ? <p>{person.title}</p> : null}
      {person.organization ? <p>Organization: {person.organization.name}</p> : null}
      {person.bio ? <p>{person.bio}</p> : null}
    </div>
  );
}
