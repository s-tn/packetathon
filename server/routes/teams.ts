import { prisma } from '../db';
import { sgMail, SEND_EMAIL } from '../mail';
import type { RouteDefinition } from '../types';

const routes: RouteDefinition[] = [
  {
    path: '/api/teams',
    handler: (req, res) => {
      prisma.team.findMany({
        include: {
          members: true,
        },
      }).then(teams => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ teams }));
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
  {
    path: '/api/createteam',
    handler: async (req, res) => {
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }
      const { name, project, categories, experience, maxSize } = req.body;
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
      // Check if student's school allows team creation
      const userSchool = await prisma.school.findUnique({ where: { value: user.school } });
      if (userSchool && !userSchool.allowTeamCreation && !user.admin) {
        const isSchoolAdmin = await prisma.schoolAdmin.findFirst({ where: { userId: user.id } });
        if (!isSchoolAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Team creation is managed by your school administrator' }));
          return;
        }
      }
      const team = await prisma.team.create({
        data: {
          name,
          project,
          categories,
          experience,
          maxSize: maxSize.toString(),
          leaderId: user.id,
          members: {
            connect: { id: user.id },
          },
        },
      });
      await prisma.registration.updateMany({
        where: {
          userId: user.id,
          teamId: null
        },
        data: {
          teamId: team.id,
          status: 1,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          teams: {
            connect: { id: team.id },
          },
        },
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ team }));
    },
  },
  {
    path: '/api/join',
    handler: async (req, res) => {
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }
      const { teamId } = req.body;
      if (!teamId) {
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
      // Check if student's school allows team creation/joining
      const joinUserSchool = await prisma.school.findUnique({ where: { value: user.school } });
      if (joinUserSchool && !joinUserSchool.allowTeamCreation && !user.admin) {
        const isSchoolAdmin = await prisma.schoolAdmin.findFirst({ where: { userId: user.id } });
        if (!isSchoolAdmin) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Team joining is managed by your school administrator' }));
          return;
        }
      }
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: true
        }
      });
      if (!team) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team not found' }));
        return;
      }
      if (team.members.length >= parseInt(team.maxSize)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team is full' }));
        return;
      }
      const existingMember = await prisma.team.findFirst({
        where: {
          members: {
            some: {
              id: req.session.userId,
            },
          },
        },
      });
      if (existingMember) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User is already a member of the team' }));
        return;
      }
      await prisma.registration.updateMany({
        where: {
          userId: req.session.userId,
          teamId: null,
        },
        data: {
          teamId: team.id,
          status: 0,
        },
      });
      await prisma.request.create({
        data: {
          userId: req.session.userId,
          teamId,
        },
      }).then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
  {
    path: '/api/accept',
    handler: async (req, res) => {
      const { id } = req.body;
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request ID is required' }));
        return;
      }
      const request = await prisma.request.findFirst({
        where: {
          id: id
        },
        include: {
          user: true,
          team: true,
        },
      });

      if (!request) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }

      const team = await prisma.team.findFirst({
        where: {
          id: request.teamId,
        },
        include: {
          members: true,
        },
      });

      if (!team) {
        console.log('Team not found', id);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team not found' }));
        return;
      }

      if (team.leaderId !== req.session.userId) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'You are not the team leader' }));
        return;
      }

      const user = await prisma.user.findFirst({
        where: {
          id: request.userId,
        },
        include: {
          teams: true
        }
      });

      if (!user) {
        console.log('User not found', id);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      if (user.teams.length > 0) {
        console.log('User already in a team', id);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User already in a team' }));
        return;
      }

      const registration = await prisma.registration.findFirst({
        where: {
          userId: request.userId,
        },
        include: {
          team: true,
        },
      });

      if (team.members.length >= parseInt(team.maxSize)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team is full' }));
        return;
      }

      if (team?.members.some(member => member.id === request.userId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User is already a member of the team' }));
        return;
      }

      await prisma.team.update({
        where: {
          id: team.id,
        },
        data: {
          members: {
            connect: {
              id: request.userId,
            },
          },
        },
      });

      await prisma.request.delete({
        where: {
          id: request.id,
        },
      });

      prisma.registration.update({
        where: {
          id: registration!.id,
        },
        data: {
          status: 1,
        },
      }).then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
  {
    path: '/api/reject',
    handler: async (req, res) => {
      const { id } = req.body;
      const request = await prisma.request.findFirst({
        where: {
          id: id
        },
        include: {
          user: true,
          team: true,
        },
      });

      if (!request) {
        console.log('Request not found', id);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request not found' }));
        return;
      }

      if (request.team.leaderId !== req.session.userId) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'You are not the team leader' }));
        return;
      }

      await prisma.registration.updateMany({
        where: {
          userId: request.userId,
          teamId: request.teamId,
        },
        data: {
          status: 2,
          teamId: {
            set: null
          },
        },
      });

      await prisma.request.delete({
        where: {
          id: request.id,
        },
      }).then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
  {
    path: '/api/cancel-request',
    handler: async (req, res) => {
      const request = await prisma.request.findFirst({
        where: {
          userId: req.session.userId,
        },
        include: {
          user: true,
          team: true,
        },
      });

      if (!request) {
        console.log('Request not found');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request not found' }));
        return;
      }

      await prisma.registration.updateMany({
        where: {
          userId: request.userId,
          teamId: request.teamId,
        },
        data: {
          status: 2,
          teamId: {
            set: null
          },
        },
      });

      await prisma.request.delete({
        where: {
          id: request.id,
        },
      }).then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
  {
    path: '/api/remove',
    handler: async (req, res) => {
      const { id } = req.body;
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request ID is required' }));
        return;
      }

      const user = await prisma.user.findFirst({
        where: {
          id
        }
      });

      const email = user?.email;

      const team = await prisma.team.findFirst({
        where: {
          members: {
            some: {
              id: user!.id,
            },
          },
        },
        include: {
          members: true,
        },
      });

      if (!team) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team not found' }));
        return;
      }

      if (id !== req.session.userId) {
        if (team.leaderId !== req.session.userId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'You are not the team leader' }));
          return;
        }
      }

      await prisma.registration.updateMany({
        where: {
          userId: user!.id,
        },
        data: {
          status: 2,
          teamId: {
            set: null
          }
        },
      });

      await prisma.team.update({
        where: {
          id: team.id,
        },
        data: {
          members: {
            disconnect: {
              id: user!.id,
            },
          },
        },
      });
      await prisma.request.deleteMany({
        where: {
          userId: user!.id,
          teamId: team.id,
        },
      });

      if (id === req.session.userId && team.leaderId === id) {
        await prisma.registration.updateMany({
          where: {
            teamId: team.id,
          },
          data: {
            teamId: {
              set: null
            },
            status: 2,
          },
        });
        await prisma.team.delete({
          where: {
            id: team.id,
          },
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({}));
      }
      await prisma.user.update(
        {
          where: {
            id: user!.id,
          },
          data: {
            teams: {
              disconnect: {
                id: team.id,
              },
            },
          },
        }
      ).then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));

        const msg = {
          to: email,
          from: SEND_EMAIL,
          templateId: 'd-2ed060d57af44b0fb2564c0d4251d72a',
          dynamicTemplateData: {
            name: user!.name,
          },
        };
        sgMail.send(msg).then(() => {
          console.log('Email sent');
        });
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
  {
    path: '/api/edit',
    handler: async (req, res) => {
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }
      const { name, project, categories, experience, maxSize, id } = req.body;
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
      const team = await prisma.team.findFirst({
        where: {
          id: id,
        }
      });
      if (!team) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team not found' }));
        return;
      }
      if (team.leaderId !== req.session.userId) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'You are not the team leader' }));
        return;
      }
      const members = await prisma.user.findMany({
        where: {
          teams: {
            some: {
              id: team.id,
            },
          },
        },
      });
      if (members.length > parseInt(maxSize)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Team size exceeds max size' }));
        return;
      }
      await prisma.team.update({
        where: { id: team.id },
        data: {
          name,
          project,
          categories,
          experience,
          maxSize,
        },
      }).then(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
];

export default routes;
