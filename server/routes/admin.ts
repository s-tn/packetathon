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
            registrations: {
              select: { id: true, teamId: true, status: true }
            },
            requests: {
              select: { id: true, teamId: true, team: { select: { name: true } } }
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
        if (!action) { res.writeHead(400).end(); return; }
        if (!['import-students', 'import-teams'].includes(action) && (userId === undefined || userId === null)) {
          res.writeHead(400).end(); return;
        }

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
                const userName = s.name || `${s.fname || ''} ${s.lname || ''}`.trim();
                const newUser = await prisma.user.create({
                  data: {
                    name: userName,
                    fname: s.fname || userName.split(' ')[0] || '',
                    lname: s.lname || userName.split(' ').slice(1).join(' ') || '',
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
                    resetPasswordToken: Math.random().toString(36).slice(2) + Date.now().toString(36),
                    parents: s.parents || '[]',
                  }
                });
                // Create registration and optionally assign to team
                let teamId = null;
                if (s.team) {
                  const team = await prisma.team.findFirst({ where: { name: s.team } });
                  if (team) {
                    const memberCount = await prisma.user.count({ where: { teams: { some: { id: team.id } } } });
                    if (memberCount < parseInt(team.maxSize)) {
                      await prisma.team.update({ where: { id: team.id }, data: { members: { connect: { id: newUser.id } } } });
                      teamId = team.id;
                    } else {
                      results.errors.push(`${s.email}: team "${s.team}" is full, registered without team`);
                    }
                  } else {
                    results.errors.push(`${s.email}: team "${s.team}" not found, registered without team`);
                  }
                }
                await prisma.registration.create({
                  data: { userId: newUser.id, teamId, status: 1 }
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
                categories: await (async () => {
                  try {
                    const cats = JSON.parse(categories || '[]');
                    const validCats = await prisma.category.findMany();
                    const validValues = new Set(validCats.map(c => c.value));
                    return JSON.stringify(cats.filter((c: any) => validValues.has(c.value)));
                  } catch { return '[]'; }
                })(),
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
            if (categories !== undefined) {
              // Validate categories against database
              try {
                const cats = JSON.parse(categories || '[]');
                const validCats = await prisma.category.findMany();
                const validValues = new Set(validCats.map(c => c.value));
                updateData.categories = JSON.stringify(cats.filter((c: any) => validValues.has(c.value)));
              } catch { updateData.categories = '[]'; }
            }
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
              return res.end(JSON.stringify({ error: 'User already on this team' }));
            }
            const existingTeam = await prisma.team.findFirst({ where: { members: { some: { id: userId } } } });
            if (existingTeam) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: `User is already on team "${existingTeam.name}"` }));
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
                const team = await prisma.team.create({
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
                await prisma.registration.updateMany({
                  where: { userId: leader.id, teamId: null },
                  data: { teamId: team.id, status: 1 },
                });
                // Add additional members from semicolon-separated email list
                if (t.memberEmails) {
                  const emails = t.memberEmails.split(';').map((e: string) => e.trim()).filter(Boolean);
                  for (const email of emails) {
                    const member = await prisma.user.findUnique({ where: { email } });
                    if (!member) { results.errors.push(`${t.name}: member ${email} not found`); continue; }
                    const alreadyOnTeam = await prisma.team.findFirst({ where: { members: { some: { id: member.id } } } });
                    if (alreadyOnTeam) { results.errors.push(`${t.name}: ${email} already on team "${alreadyOnTeam.name}"`); continue; }
                    await prisma.team.update({ where: { id: team.id }, data: { members: { connect: { id: member.id } } } });
                    await prisma.registration.updateMany({ where: { userId: member.id, teamId: null }, data: { teamId: team.id, status: 1 } });
                  }
                }
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
