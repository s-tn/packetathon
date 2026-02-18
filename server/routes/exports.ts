import { prisma } from '../db';
import { createObjectCsvStringifier as csvGenerate } from 'csv-writer';
import type { RouteDefinition } from '../types';

const routes: RouteDefinition[] = [
  {
    path: '/api/export-teams',
    handler: async (req, res) => {
      const userId = req.session.userId;

      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teams: true,
          registrations: true,
        }
      });

      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }

      if (!user.admin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User does not have permission to export data' }));
        return;
      }

      const teams = csvGenerate({
        header: [
          { id: 'id', title: 'Team ID' },
          { id: 'name', title: 'Team Name' },
          { id: 'project', title: 'Project' },
          { id: 'categories', title: 'Categories' },
          { id: 'experience', title: 'Experience' },
          { id: 'maxSize', title: 'Max Size' },
          { id: 'members', title: 'Members' }
        ]
      });

      res.writeHead(200, {}).end(teams.getHeaderString() + '\n' + teams.stringifyRecords(
        await prisma.team.findMany({
          include: {
            members: true
          }
        }).then(teams => {
          return teams.map(team => ({
            id: team.id,
            name: team.name,
            project: team.project,
            categories: JSON.parse(team.categories).map((category: any) => category.label).join(', '),
            experience: team.experience,
            maxSize: team.maxSize,
            members: team.members.map(m => m.name).join(', ')
          }));
        }
        )));
    },
  },
  {
    path: '/api/export-people',
    handler: async (req, res) => {
      const userId = req.session.userId;

      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teams: true,
          registrations: true,
        }
      });

      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }

      if (!user.admin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User does not have permission to export data' }));
        return;
      }

      const teams = csvGenerate({
        header: [
          { id: 'id', title: 'User ID' },
          { id: 'name', title: 'User Name' },
          { id: 'fname', title: 'First Name' },
          { id: 'lname', title: 'Last Name' },
          { id: 'email', title: 'Email Address' },
          { id: 'phone', title: 'Phone Number' },
          { id: 'parents', title: 'Parents' },
          { id: 'school', title: 'School' },
          { id: 'major', title: 'Major' },
          { id: 'grade', title: 'Grade' },
          { id: 'verified', title: 'Verified' },
        ]
      });

      res.writeHead(200, {}).end(teams.getHeaderString() + '\n' + teams.stringifyRecords(
        await prisma.user.findMany({
          where: {
            admin: false
          }
        }).then(users => {
          return users.map(user => ({
            id: user.id,
            name: user.name,
            fname: user.fname || '',
            lname: user.lname || '',
            email: user.email,
            phone: user.phone || '',
            school: user.school || '',
            major: user.major || '',
            grade: user.grade || '',
            verified: user.verified ? 'Yes' : 'No',
          }));
        }
        )));
    },
  },
];

export default routes;
