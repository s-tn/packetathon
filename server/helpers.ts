import { prisma } from './db';

export function compileParents(screen0: any) {
  const parents: any[] = [];
  const fields = [['first-name', 'fname'], ['last-name', 'lname'], ['email', 'email'], ['phone', 'phone'], ['relationship', 'relationship']];

  for (let i = 0; i < screen0.parents; i++) {
    const parent: any = {};
    console.log(screen0);
    fields.forEach(([parse, field]) => {
      parent[field] = screen0[`parent${i + 1}-${parse}`];
    });
    parents.push(parent);
  }

  return parents;
}

export async function createRegistration({ userId, screen1, screen2 }: { userId: number; screen1: any; screen2: any }) {
  try {
    if (screen1 === undefined || screen2 === undefined) {
      throw new Error('Screen1 and Screen2 are required');
    }

    console.log('ugƒhregb')

    if (screen1.teamType === 'create') {
      const team = await prisma.team.create({
        data: {
          name: screen1['team-name'],
          project: screen1['project-idea'],
          leaderId: userId,
          experience: screen1.experience,
          members: {
            connect: { id: userId },
          },
          maxSize: screen1.teamInformation.memberCount.value.toString(),
          categories: JSON.stringify(screen1.teamInformation.categories),
        },
      });

      console.log('Team created:', team);

      const registration = await prisma.registration.create({
        data: {
          userId,
          teamId: team.id
        },
      });

      return registration;
    } else if (screen1.teamType === 'join') {
      const team = await prisma.team.findUnique({
        where: {
          id: screen1.teamInformation.id,
        },
        include: {
          members: true,
        },
      });
      console.log(team);
      if (!team) {
        throw new Error('Team not found');
      }
      if (team.members.length >= parseInt(team.maxSize)) {
        throw new Error('Team is full');
      }
      const registration = await prisma.registration.create({
        data: {
          userId,
          teamId: team.id,
          status: 0
        },
      });
      await prisma.request.create({
        data: {
          userId,
          teamId: team.id,
        },
      });
      console.log('Registration created:', registration);
      return registration;
    } else {
      const registration = await prisma.registration.create({
        data: {
          userId,
          teamId: null
        },
      });

      console.log('Registration created:', registration);

      return registration;
    }
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
}
