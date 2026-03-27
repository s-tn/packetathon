import { prisma } from './db';
import { sgMail, SEND_EMAIL } from './mail';

export function compileParents(screen0: any) {
  const parents: any[] = [];
  const fields = [['first-name', 'fname'], ['last-name', 'lname'], ['email', 'email'], ['phone', 'phone'], ['relationship', 'relationship']];

  for (let i = 0; i < screen0.parents; i++) {
    const parent: any = {};
    fields.forEach(([parse, field]) => {
      parent[field] = screen0[`parent${i + 1}-${parse}`];
    });
    parents.push(parent);
  }

  return parents;
}

export async function createRegistration({ userId, screen1, tx = prisma, host }: { userId: number; screen1: any; tx?: any; host?: string }) {
  try {
    if (screen1 === undefined) {
      throw new Error('Screen1 is required');
    }

    if (screen1.teamType === 'create') {
      const team = await tx.team.create({
        data: {
          name: screen1['team-name'],
          project: screen1['project-idea'],
          leaderId: userId,
          experience: screen1.experience,
          members: {
            connect: { id: userId },
          },
          maxSize: screen1.teamInformation.memberCount.value.toString(),
          categories: JSON.stringify(screen1.teamInformation?.categories || []),
        },
      });

      console.log('Team created:', team);

      const registration = await tx.registration.create({
        data: {
          userId,
          teamId: team.id
        },
      });

      return registration;
    } else if (screen1.teamType === 'join') {
      const team = await tx.team.findUnique({
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
      const registration = await tx.registration.create({
        data: {
          userId,
          teamId: team.id,
          status: 0
        },
      });
      await tx.request.create({
        data: {
          userId,
          teamId: team.id,
        },
      });
      // Notify team leader of join request (fire-and-forget, outside transaction)
      if (host) {
        const leader = await tx.user.findUnique({ where: { id: team.leaderId } });
        const requester = await tx.user.findUnique({ where: { id: userId } });
        if (leader && requester) {
          sgMail.send({
            from: SEND_EMAIL,
            to: leader.email,
            templateId: 'd-7dc82929d5784cd9b53d237f14ad5d0f',
            dynamicTemplateData: {
              name: leader.fname || leader.name,
              requesterName: requester.name,
              teamName: team.name,
              url: `${host}/signup/dashboard/requests`,
            },
          }).then(() => {
            console.log('Join request notification sent to', leader.email);
          }).catch((error) => {
            console.error('Error sending join request notification:', error);
          });
        }
      }
      console.log('Registration created:', registration);
      return registration;
    } else {
      const registration = await tx.registration.create({
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
