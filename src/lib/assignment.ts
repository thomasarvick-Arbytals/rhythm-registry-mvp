import { prisma } from '@/lib/prisma';

function overlapCount(a: string[], b: string[]) {
  const bs = new Set(b.map((x) => x.toLowerCase()));
  return a.reduce((acc, x) => acc + (bs.has(x.toLowerCase()) ? 1 : 0), 0);
}

export async function assignProducerToEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error('Event not found');
  if (event.status !== 'AWAITING_ASSIGNMENT') return null;

  const producers = await prisma.producerProfile.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  if (producers.length === 0) return null;

  const ranked = producers
    .map((p) => ({
      profile: p,
      score: overlapCount(event.vibeTags, p.vibeTags ?? []),
    }))
    .sort((a, b) => b.score - a.score);

  const chosen = ranked[0].profile;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      assignedProducerId: chosen.userId,
      status: 'ASSIGNED',
    },
  });

  return chosen.userId;
}
