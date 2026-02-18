import { prisma } from '../db';
import type { RouteDefinition } from '../types';

const routes: RouteDefinition[] = [
  {
    path: '/api/user',
    handler: (req, res) => {
      if (req.session.userId) {
        prisma.user.findUnique({
          where: { id: req.session.userId },
        }).then(async user => {
          if (user) {
            if (!user.verified) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'User not verified' }));
              return;
            }
            (user as any).team = await prisma.team.findFirst({
              where: {
                members: {
                  some: {
                    id: user.id,
                  },
                },
              },
            });
            (user as any).registration = await prisma.registration.findFirst({
              where: {
                userId: user.id,
              },
            });
            const schoolAdminAssignments = await prisma.schoolAdmin.findMany({
              where: { userId: user.id },
              include: { school: true },
            });
            (user as any).isSchoolAdmin = schoolAdminAssignments.length > 0;
            (user as any).adminSchools = schoolAdminAssignments.map(a => a.school);
            // Include school's allowTeamCreation flag
            const userSchool = await prisma.school.findUnique({ where: { value: user.school } });
            (user as any).allowTeamCreation = userSchool?.allowTeamCreation ?? true;
            if ((user as any).team) {
              (user as any).team.members = await prisma.user.findMany({
                where: {
                  teams: {
                    some: {
                      id: (user as any).team.id,
                    }
                  }
                }
              });
              if ((user as any).team.leaderId === user.id) {
                (user as any).team.isLeader = true;
                (user as any).team.requests = await prisma.request.findMany({
                  where: {
                    teamId: (user as any).team.id,
                  },
                  include: {
                    user: true,
                  },
                });
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ user }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
          }
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      }
    },
  },
  {
    path: '/api/delete',
    handler: async (req, res) => {
      const id = req.session.userId;
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team ID is required' }));
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
      });

      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      if (!user.verified) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not verified' }));
        return;
      }

      await prisma.registration.deleteMany({
        where: {
          userId: user.id,
        }
      });

      await prisma.request.deleteMany({
        where: {
          userId: user.id,
        }
      });

      await prisma.team.deleteMany({
        where: {
          leaderId: user.id,
        }
      });

      await prisma.user.delete({
        where: { id: user.id },
      }).then(() => {
        req.session.destroy((err) => {
          if (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({}));
        });
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
];

export default routes;
