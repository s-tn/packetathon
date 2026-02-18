import { prisma } from '../db';
import type { RouteDefinition } from '../types';

const routes: RouteDefinition[] = [
  {
    path: '/api/schools',
    handler: async (req, res) => {
      if (req.method === 'GET') {
        const schools = await prisma.school.findMany({
          include: {
            majors: true,
            admins: { include: { user: { select: { name: true, email: true } } } },
          },
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ schools }));
      } else if (req.method === 'PATCH') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { id, allowSelfRegistration, allowTeamCreation, label, value } = req.body;
        const updateData: any = {};
        if (allowSelfRegistration !== undefined) updateData.allowSelfRegistration = allowSelfRegistration;
        if (allowTeamCreation !== undefined) updateData.allowTeamCreation = allowTeamCreation;
        if (label !== undefined) updateData.label = label;
        if (value !== undefined) updateData.value = value;
        try {
          await prisma.school.update({
            where: { id },
            data: updateData,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({}));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to update school' }));
        }
      } else if (req.method === 'POST') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { value, label } = req.body;
        try {
          const school = await prisma.school.create({ data: { value, label } });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ school }));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to create school' }));
        }
      } else if (req.method === 'DELETE') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { id } = req.body;
        try {
          await prisma.major.deleteMany({ where: { schoolId: id } });
          await prisma.school.delete({ where: { id } });
          res.writeHead(200).end(JSON.stringify({}));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to delete school' }));
        }
      }
    },
  },
  {
    path: '/api/majors',
    handler: async (req, res) => {
      if (req.method === 'POST') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { value, label, schoolId } = req.body;
        try {
          const major = await prisma.major.create({ data: { value, label, schoolId } });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ major }));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to create major' }));
        }
      } else if (req.method === 'DELETE') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { id } = req.body;
        try {
          await prisma.major.delete({ where: { id } });
          res.writeHead(200).end(JSON.stringify({}));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to delete major' }));
        }
      }
    },
  },
  {
    path: '/api/categories',
    handler: async (req, res) => {
      if (req.method === 'GET') {
        const categories = await prisma.category.findMany();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ categories }));
      } else if (req.method === 'POST') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { value, label, description, prize } = req.body;
        try {
          const category = await prisma.category.create({ data: { value, label, description: description || '', prize: prize ? parseFloat(prize) : 0 } });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ category }));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to create category' }));
        }
      } else if (req.method === 'PATCH') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { id, label, description, prize } = req.body;
        if (!id) return res.writeHead(400).end(JSON.stringify({ error: 'id required' }));
        const updateData: any = {};
        if (label !== undefined) updateData.label = label;
        if (description !== undefined) updateData.description = description;
        if (prize !== undefined) updateData.prize = parseFloat(prize);
        try {
          await prisma.category.update({ where: { id }, data: updateData });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({}));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to update category' }));
        }
      } else if (req.method === 'DELETE') {
        if (!req.session.userId) return res.writeHead(401).end();
        const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
        if (!user?.admin) return res.writeHead(403).end();

        const { id } = req.body;
        try {
          await prisma.category.delete({ where: { id } });
          res.writeHead(200).end(JSON.stringify({}));
        } catch (e) {
          res.writeHead(500).end(JSON.stringify({ error: 'Failed to delete category' }));
        }
      }
    },
  },
];

export default routes;
