import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import type { RouteDefinition } from '../types';

const routes: RouteDefinition[] = [
  {
    path: '/api/admin/users',
    handler: async (req, res) => {
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }
      const currentUser = await prisma.user.findUnique({ where: { id: req.session.userId } });
      if (!currentUser?.admin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Forbidden' }));
      }

      if (req.method === 'GET') {
        const users = await prisma.user.findMany({
          orderBy: { id: 'desc' },
          include: {
            teams: {
              select: { id: true, name: true }
            },
            schoolAdminAssignments: {
              include: { school: true }
            }
          }
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ users }));
      } else if (req.method === 'POST') {
        const { action, userId, data } = req.body;
        if (!userId) return res.writeHead(400).end();

        try {
          if (action === 'delete') {
            await prisma.registration.deleteMany({ where: { userId } });
            await prisma.session.deleteMany({ where: { userId } });
            await prisma.user.delete({ where: { id: userId } });
          } else if (action === 'verify') {
            await prisma.user.update({ where: { id: userId }, data: { verified: true } });
          } else if (action === 'unverify') {
            await prisma.user.update({ where: { id: userId }, data: { verified: false } });
          } else if (action === 'promote') {
            await prisma.user.update({ where: { id: userId }, data: { admin: true } });
          } else if (action === 'demote') {
            await prisma.user.update({ where: { id: userId }, data: { admin: false } });
          } else if (action === 'assign-school-admin') {
            const { schoolId } = data || {};
            if (!schoolId) { res.writeHead(400).end(JSON.stringify({ error: 'schoolId required' })); return; }
            await prisma.schoolAdmin.create({ data: { userId, schoolId } });
          } else if (action === 'remove-school-admin') {
            const { schoolId } = data || {};
            if (!schoolId) { res.writeHead(400).end(JSON.stringify({ error: 'schoolId required' })); return; }
            await prisma.schoolAdmin.delete({ where: { userId_schoolId: { userId, schoolId } } });
          } else if (action === 'import-students') {
            // Bulk import students from CSV data
            // data.students is an array of { name, email, phone, school, major, grade, shirt }
            const { students } = data || {};
            if (!students?.length) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'No students to import' }));
            }
            const results = { created: 0, skipped: 0, errors: [] as string[] };
            for (const s of students) {
              try {
                const existing = await prisma.user.findUnique({ where: { email: s.email } });
                if (existing) { results.skipped++; results.errors.push(`${s.email}: already exists`); continue; }
                const hashedPassword = await bcrypt.hash(s.password || 'hackathon2026', 5);
                await prisma.user.create({
                  data: {
                    name: s.name || `${s.fname || ''} ${s.lname || ''}`.trim(),
                    fname: s.fname || s.name?.split(' ')[0] || '',
                    lname: s.lname || s.name?.split(' ').slice(1).join(' ') || '',
                    email: s.email,
                    phone: s.phone || '',
                    school: s.school || 'bt',
                    major: s.major || 'compsci',
                    grade: s.grade || '9',
                    shirt: s.shirt || 'M',
                    password: hashedPassword,
                    verified: true,
                    verificationCode: '000000',
                    verificationCodeExpiry: new Date(),
                    parents: s.parents || '[]',
                  }
                });
                results.created++;
              } catch (e: any) {
                results.errors.push(`${s.email}: ${e.message}`);
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ...results }));
          }
          res.writeHead(200).end(JSON.stringify({}));
        } catch (e) {
          console.error(e);
          res.writeHead(500).end(JSON.stringify({ error: 'Action failed' }));
        }
      }
    },
  },
  {
    path: '/api/admin/teams',
    handler: async (req, res) => {
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }
      const currentUser = await prisma.user.findUnique({ where: { id: req.session.userId } });
      if (!currentUser?.admin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Forbidden' }));
      }

      if (req.method === 'GET') {
        const teams = await prisma.team.findMany({
          include: {
            members: { select: { id: true, name: true, email: true } },
            leader: { select: { id: true, name: true, email: true } },
            requests: { include: { user: { select: { id: true, name: true } } } }
          },
          orderBy: { id: 'desc' }
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ teams }));
      } else if (req.method === 'POST') {
        const { action, teamId, data } = req.body;

        try {
          if (action === 'delete') {
            if (!teamId) return res.writeHead(400).end();
            await prisma.request.deleteMany({ where: { teamId } });
            await prisma.registration.updateMany({
              where: { teamId },
              data: { teamId: null, status: 2 }
            });
            await prisma.team.delete({ where: { id: teamId } });
          } else if (action === 'create') {
            const { name, project, leaderId, maxSize, experience, categories } = data || {};
            if (!name || !project || !leaderId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'name, project, and leaderId are required' }));
            }
            const team = await prisma.team.create({
              data: {
                name,
                project,
                leaderId,
                maxSize: (maxSize || '4').toString(),
                experience: experience || 'beginner',
                categories: categories || '[]',
                members: { connect: { id: leaderId } },
              },
            });
            await prisma.registration.updateMany({
              where: { userId: leaderId, teamId: null },
              data: { teamId: team.id, status: 1 },
            });
          } else if (action === 'edit') {
            if (!teamId) return res.writeHead(400).end();
            const { name, project, maxSize, experience, categories } = data || {};
            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (project !== undefined) updateData.project = project;
            if (maxSize !== undefined) updateData.maxSize = maxSize.toString();
            if (experience !== undefined) updateData.experience = experience;
            if (categories !== undefined) updateData.categories = categories;
            await prisma.team.update({ where: { id: teamId }, data: updateData });
          } else if (action === 'add-member') {
            if (!teamId) return res.writeHead(400).end();
            const { userId } = data || {};
            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'userId required' }));
            }
            const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
            if (!team) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Team not found' }));
            }
            if (team.members.length >= parseInt(team.maxSize)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Team is full' }));
            }
            if (team.members.some(m => m.id === userId)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'User already on team' }));
            }
            await prisma.team.update({
              where: { id: teamId },
              data: { members: { connect: { id: userId } } },
            });
            await prisma.registration.updateMany({
              where: { userId, teamId: null },
              data: { teamId, status: 1 },
            });
            await prisma.request.deleteMany({ where: { userId } });
          } else if (action === 'remove-member') {
            if (!teamId) return res.writeHead(400).end();
            const { userId } = data || {};
            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'userId required' }));
            }
            await prisma.team.update({
              where: { id: teamId },
              data: { members: { disconnect: { id: userId } } },
            });
            await prisma.registration.updateMany({
              where: { userId, teamId },
              data: { teamId: null, status: 2 },
            });
          } else if (action === 'import-teams') {
            // Bulk import teams from CSV data
            // data.teams is an array of { name, project, leaderEmail, maxSize, categories }
            const { teams: importTeams } = data || {};
            if (!importTeams?.length) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'No teams to import' }));
            }
            const results = { created: 0, skipped: 0, errors: [] as string[] };
            for (const t of importTeams) {
              try {
                const leader = await prisma.user.findUnique({ where: { email: t.leaderEmail } });
                if (!leader) { results.skipped++; results.errors.push(`${t.name}: leader ${t.leaderEmail} not found`); continue; }
                await prisma.team.create({
                  data: {
                    name: t.name,
                    project: t.project || '',
                    leaderId: leader.id,
                    maxSize: (t.maxSize || '4').toString(),
                    experience: t.experience || 'beginner',
                    categories: t.categories || '[]',
                    members: { connect: { id: leader.id } },
                  },
                });
                results.created++;
              } catch (e: any) {
                results.errors.push(`${t.name}: ${e.message}`);
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ...results }));
          }
          res.writeHead(200).end(JSON.stringify({}));
        } catch (e) {
          console.error(e);
          res.writeHead(500).end(JSON.stringify({ error: 'Action failed' }));
        }
      }
    },
  },
];

export default routes;
