import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { sgMail, SEND_EMAIL } from '../mail';
import { compileParents, createRegistration } from '../helpers';
import type { RouteDefinition } from '../types';

const routes: RouteDefinition[] = [
  {
    path: '/api/school-admin/schools',
    handler: async (req, res) => {
      if (req.method !== 'GET') return;

      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const assignments = await prisma.schoolAdmin.findMany({
        where: { userId: req.session.userId },
        include: { school: { include: { majors: true } } },
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ schools: assignments.map(a => a.school) }));
    },
  },
  {
    path: '/api/school-admin/students',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;

      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const { school } = req.body;
      if (!school) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School value required' }));
      }

      // Verify user is admin for this school
      const schoolRecord = await prisma.school.findUnique({ where: { value: school } });
      if (!schoolRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School not found' }));
      }

      const assignment = await prisma.schoolAdmin.findUnique({
        where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
      });
      if (!assignment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
      }

      const students = await prisma.user.findMany({
        where: { school },
        orderBy: { id: 'desc' },
        include: {
          teams: { select: { id: true, name: true } },
          registrations: true,
        },
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ students }));
    },
  },
  {
    path: '/api/school-admin/student',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;

      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const { id } = req.body;
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Student ID required' }));
      }

      const student = await prisma.user.findUnique({
        where: { id },
        include: {
          teams: { select: { id: true, name: true } },
          registrations: true,
        },
      });

      if (!student) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Student not found' }));
      }

      // Verify admin has access to this student's school
      const schoolRecord = await prisma.school.findUnique({ where: { value: student.school } });
      if (!schoolRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School not found' }));
      }

      const assignment = await prisma.schoolAdmin.findUnique({
        where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
      });
      if (!assignment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ student }));
    },
  },
  {
    path: '/api/school-admin/student/update',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;

      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const { id, fname, lname, email, phone, grade, major, shirt, parents } = req.body;
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Student ID required' }));
      }

      const student = await prisma.user.findUnique({ where: { id } });
      if (!student) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Student not found' }));
      }

      // Verify admin has access
      const schoolRecord = await prisma.school.findUnique({ where: { value: student.school } });
      if (!schoolRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School not found' }));
      }

      const assignment = await prisma.schoolAdmin.findUnique({
        where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
      });
      if (!assignment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
      }

      try {
        const updateData: any = {};
        if (fname !== undefined) { updateData.fname = fname; updateData.name = `${fname} ${lname || student.lname}`; }
        if (lname !== undefined) { updateData.lname = lname; updateData.name = `${fname || student.fname} ${lname}`; }
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (grade !== undefined) updateData.grade = grade;
        if (major !== undefined) updateData.major = major;
        if (shirt !== undefined) updateData.shirt = shirt;
        if (parents !== undefined) updateData.parents = parents;

        await prisma.user.update({ where: { id }, data: updateData });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      } catch (e) {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Update failed' }));
      }
    },
  },
  {
    path: '/api/school-admin/register',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;

      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      try {
        const { accountData, screen0, screen1, screen2 } = req.body;
        const { name, email, password } = accountData;
        const phone = screen0['phone'];
        const schoolValue = screen0['school']?.value || screen0['school'];

        // Verify admin has access to this school
        const schoolRecord = await prisma.school.findUnique({ where: { value: schoolValue } });
        if (!schoolRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'School not found' }));
        }

        const assignment = await prisma.schoolAdmin.findUnique({
          where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
        });
        if (!assignment) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'User already exists' }));
        }

        const hashedPassword = await bcrypt.hash(password, 5);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = await prisma.user.create({
          data: {
            name,
            fname: screen0['first-name'],
            lname: screen0['last-name'],
            parents: JSON.stringify(compileParents(screen0)),
            email,
            grade: screen0['grade']?.value || screen0['grade'],
            school: schoolValue,
            major: screen0['major']?.value || screen0['major'],
            shirt: screen0['shirt']?.value || screen0['shirt'],
            phone,
            verificationCode,
            verified: true, // Admin-registered students are pre-verified
            verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
            resetPasswordToken: null,
            resetPasswordTokenExpiry: null,
            password: hashedPassword,
            registeredByAdminId: req.session.userId,
          },
        });

        // Create registration (solo by default for admin-registered students)
        await prisma.registration.create({
          data: { userId: newUser.id, status: 1 },
        });

        // Send confirmation email (not verification)
        await sgMail.send({
          from: SEND_EMAIL,
          to: email,
          templateId: 'd-7ac09319d3c541afac4e4ff31fe72348',
          dynamicTemplateData: {
            verificationCode: 'N/A - Pre-verified by administrator',
            name: screen0['first-name'],
          },
        }).catch((error) => {
          console.error('Error sending confirmation email:', error);
        });

        // Do NOT change session - admin stays logged in as themselves
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ user: newUser }));
      } catch (error) {
        console.error(error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Registration failed' }));
      }
    },
  },
  {
    path: '/api/school-admin/teams',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const { school } = req.body;
      if (!school) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School value required' }));
      }

      const schoolRecord = await prisma.school.findUnique({ where: { value: school } });
      if (!schoolRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School not found' }));
      }

      const assignment = await prisma.schoolAdmin.findUnique({
        where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
      });
      if (!assignment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
      }

      const teams = await prisma.team.findMany({
        where: {
          members: { some: { school } },
        },
        include: {
          members: { select: { id: true, name: true, email: true, school: true } },
          leader: { select: { id: true, name: true, email: true } },
          requests: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { id: 'desc' },
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ teams }));
    },
  },
  {
    path: '/api/school-admin/team/manage',
    handler: async (req, res) => {
      if (req.method !== 'POST') return;
      if (!req.session.userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not logged in' }));
      }

      const { action, school, teamId, data } = req.body;
      if (!school) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School value required' }));
      }

      const schoolRecord = await prisma.school.findUnique({ where: { value: school } });
      if (!schoolRecord) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'School not found' }));
      }

      const assignment = await prisma.schoolAdmin.findUnique({
        where: { userId_schoolId: { userId: req.session.userId, schoolId: schoolRecord.id } },
      });
      if (!assignment) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not an admin for this school' }));
      }

      try {
        if (action === 'create') {
          const { name, project, leaderId, maxSize, experience, categories } = data || {};
          if (!name || !project || !leaderId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'name, project, and leaderId required' }));
          }
          const leader = await prisma.user.findUnique({ where: { id: leaderId } });
          if (!leader || leader.school !== school) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Leader must belong to this school' }));
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
          const student = await prisma.user.findUnique({ where: { id: userId } });
          if (!student || student.school !== school) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Student must belong to this school' }));
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
        } else if (action === 'delete') {
          if (!teamId) return res.writeHead(400).end();
          await prisma.request.deleteMany({ where: { teamId } });
          await prisma.registration.updateMany({
            where: { teamId },
            data: { teamId: null, status: 2 },
          });
          await prisma.team.delete({ where: { id: teamId } });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({}));
      } catch (e) {
        console.error(e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Action failed' }));
      }
    },
  },
];

export default routes;
