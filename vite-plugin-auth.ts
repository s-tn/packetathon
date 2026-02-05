// vite-plugin-auth.ts
import { Plugin } from 'vite';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import expressSession from 'express-session';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import { skip } from '@prisma/client/runtime/library';
import { createObjectCsvStringifier as csvGenerate } from 'csv-writer'

dotenv.config({
  path: './sendgrid.env'
});

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}

const SEND_EMAIL = "support@bthackathon.com";

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Prisma Client instance
const prisma = new PrismaClient();

export default function createAuthPlugin(): Plugin {
  return {
    name: 'vite-plugin-auth',
    configureServer(server) {
      // Setup express-session
      server.middlewares.use(expressSession({
        secret: 'secret-key', // use a more secure secret for production
        resave: false,
        saveUninitialized: false,
      }) as any);

      // Login API Endpoint
      server.middlewares.use('/api/login', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const { email, password } = req.body

            console.log(email, password);

            // Check if user exists
            const user = await prisma.user.findUnique({
              where: { email },
            });

            console.log(user);

            if (!user || !(bcrypt.compareSync(password, user.password))) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid email or password' }));
              return;
            }

            // Create a session for the user
            req.session.userId = user.id;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Login successful', user }));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request' }));
          }
        }
      });

      // Check Login Status
      server.middlewares.use('/api/check-login', (req, res) => {
        if (req.session.userId) {
          const userId = req.session.userId;
          prisma.user.findUnique({
            where: { id: userId },
          }).then(user => {
            if (user) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ loggedIn: true, user }));
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ loggedIn: false }));
            }
          }).catch(err => {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          });
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ loggedIn: false }));
        }
      });

      server.middlewares.use('/api/teams', (req, res) => {
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
      });

      server.middlewares.use('/api/accept', async (req, res) => {
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
            id: registration.id,
          },
          data: {
            status: 1,
          },
        }).then(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User accepted to the team' }));
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/reject', async (req, res) => {
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

        /* TODO: email */

        await prisma.registration.updateMany({
          where: {
            userId: request.userId,
            teamId: request.teamId,
          },
          data: {
            status: 2, // Assuming 2 means rejected
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
          res.end(JSON.stringify({ message: 'User rejected from the team' }));
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/cancel-request', async (req, res) => {
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

        /* TODO: email */

        await prisma.registration.updateMany({
          where: {
            userId: request.userId,
            teamId: request.teamId,
          },
          data: {
            status: 2, // Assuming 2 means rejected
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
          res.end(JSON.stringify({ message: 'Request cancelled' }));
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/forgot-password', (req, res) => {
        const { email } = req.body;
        if (!email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email is required' }));
          return;
        }

        // Check if user exists
        if (req.session.nextCode && new Date(req.session.nextCode) > new Date()) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please wait before requesting a new code' }));
          return;
        }

        // Fetch user data from the database
        prisma.user.findUnique({
          where: { email },
        }).then(async user => {
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }

          const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
          await prisma.user.update({
            where: { id: user.id },
            data: {
              resetPasswordToken: resetToken,
              resetPasswordTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
            },
          });

          const url = `${req.protocol}://${req.headers['host']}/signup/dashboard/reset/${btoa(resetToken)}?qcv=${btoa(user.email)}`;

          req.session.nextCode = new Date(Date.now() + 30 * 1000);

          // Send a verification email
          const msg = {
            to: email,
            from: SEND_EMAIL,
            templateId: 'd-67a77bca54444fdeb546f024a5057d57',
            dynamicTemplateData: {
              url: url
            },
          };
          sgMail.send(msg).then(() => {
            console.log('Email sent', email);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Reset email sent' }));
          }).catch((error) => {
            console.error('Error sending email:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          });
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/export-teams', async (req, res) => {
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
        })

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
              categories: JSON.parse(team.categories).map(category => category.label).join(', '),
              experience: team.experience,
              maxSize: team.maxSize,
              members: team.members.map(m => m.name).join(', ')
            }));
          }
          )));
      });

      server.middlewares.use('/api/export-people', async (req, res) => {
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
        })

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
      });

      server.middlewares.use('/api/resend-reset', (req, res) => {
        const { token } = req.body;
        console.log(token);
        if (!token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Token is required' }));
          return;
        }

        // Check if user exists
        if (req.session.nextCode && new Date(req.session.nextCode) > new Date()) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please wait before requesting a new code' }));
          return;
        }

        // Fetch user data from the database
        prisma.user.findUnique({
          where: { resetPasswordToken: token },
        }).then(async user => {
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }

          const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
          await prisma.user.update({
            where: { id: user.id },
            data: {
              resetPasswordToken: resetToken,
              resetPasswordTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
            },
          });

          const url = `${req.protocol}://${req.headers['host']}/signup/dashboard/reset/${btoa(resetToken)}?qcv=${btoa(user.email)}`;

          req.session.nextCode = new Date(Date.now() + 30 * 1000);

          // Send a verification email
          const msg = {
            to: user.email,
            from: SEND_EMAIL,
            templateId: 'd-67a77bca54444fdeb546f024a5057d57',
            dynamicTemplateData: {
              url: url
            },
          };
          sgMail.send(msg).then(() => {
            console.log('Email sent');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Reset email sent' }));
          }).catch((error) => {
            console.error('Error sending email:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          });
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/reset', (req, res) => {
        const { token, password } = req.body;
        if (!token || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Token and password are required' }));
          return;
        }
        // Fetch user data from the database
        prisma.user.findUnique({
          where: { resetPasswordToken: token },
        }).then(async user => {
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }
          if (new Date() > user.resetPasswordTokenExpiry) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Reset token expired' }));
            return;
          }
          // Hash the new password
          const hashedPassword = await bcrypt.hash(password, 5);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              password: hashedPassword,
              resetPasswordToken: null,
              resetPasswordTokenExpiry: null,
            },
          });
          req.session.destroy((err) => {
            if (err) {
              console.error(err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal server error' }));
              return;
            }
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Password reset successful' }));
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/resend', (req, res) => {
        const userId = req.session.userId;
        if (!userId) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not logged in' }));
          return;
        }

        const nextCode = new Date(req.session.nextCode || 0);
        if (nextCode && nextCode > new Date()) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please wait before requesting a new code' }));
          return;
        }

        // Fetch user data from the database
        prisma.user.findUnique({
          where: { id: userId },
        }).then(async user => {
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }

          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
          await prisma.user.update({
            where: { id: userId },
            data: {
              verificationCode,
              verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
            },
          });
          req.session.nextCode = new Date(Date.now() + 30 * 1000);

          // Send a verification email
          const msg = {
            to: user.email,
            from: SEND_EMAIL,
            templateId: 'd-7ac09319d3c541afac4e4ff31fe72348',
            dynamicTemplateData: {
              verificationCode: verificationCode,
              name: user.name,
            },
          };
          sgMail.send(msg).then(() => {
            console.log('Email sent');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Verification email sent' }));
          }).catch((error) => {
            console.error('Error sending email:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          });
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      // Verify Code Endpoint
      server.middlewares.use('/api/verify', (req, res) => {
        const { code } = req.body;
        const userId = req.session.userId;

        if (!userId) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not logged in' }));
          return;
        }

        // Fetch user data from the database
        prisma.user.findUnique({
          where: { id: userId },
        }).then(user => {
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }

          if (user.verificationCode !== code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid verification code' }));
            return;
          }

          if (new Date() > user.verificationCodeExpiry) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Verification code expired' }));
            return;
          }

          // Update user verification status
          prisma.user.update({
            where: { id: userId },
            data: {
              verified: true,
            },
          }).then(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User verified successfully' }));
          }).catch(err => {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          });
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/edit', async (req, res) => {
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
          res.end(JSON.stringify({ status: 'success' }));
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      // Data Seeding and Management APIs
      const seedData = async () => {
        const schoolsCount = await prisma.school.count();
        if (schoolsCount === 0) {
          console.log('Seeding schools and majors...');
          const bt = await prisma.school.create({
            data: { value: 'bt', label: 'Bergen Tech' }
          });
          const at = await prisma.school.create({
            data: { value: 'at', label: 'Applied Tech' }
          });

          const majs = {
            bt: [
              { value: "compsci", label: "Computer Science" },
              { value: "digital", label: "Digital Media" },
              { value: "business", label: "Business" },
              { value: "aero", label: "Aerospace Engineering" },
              { value: "auto", label: "Automotive Engineering" },
              { value: "law", label: "Law" },
              { value: "culinary", label: "Culinary" },
              { value: "comart", label: "Commercial Art" },
              { value: "other", label: "Other" }
            ],
            at: [
              { value: "cyber", label: "Cybersecurity" },
              { value: "other", label: "Other" }
            ]
          };

          for (const m of majs.bt) {
            await prisma.major.create({
              data: { ...m, schoolId: bt.id }
            });
          }
          for (const m of majs.at) {
            await prisma.major.create({
              data: { ...m, schoolId: at.id }
            });
          }
        }

        const catCount = await prisma.category.count();
        if (catCount === 0) {
          console.log('Seeding categories...');
          const categories = [
            { value: 'ai', label: 'Best Artificial Intelligence' },
            { value: 'mobile', label: 'Best Mobile App' },
            { value: 'hardware', label: 'Best Physical System' },
            { value: 'game', label: 'Best Game' },
            { value: 'freshman', label: 'Best Freshman Project' },
            { value: 'beginner', label: 'Best New Coder' }
          ];
          for (const c of categories) {
            await prisma.category.create({ data: c });
          }
        }
      };

      // Run seeding
      seedData();


      // Schools API
      server.middlewares.use('/api/schools', async (req, res) => {
        if (req.method === 'GET') {
          const schools = await prisma.school.findMany({ include: { majors: true } });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ schools }));
        } else if (req.method === 'POST') {
          // Admin check
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
          // Admin check
          if (!req.session.userId) return res.writeHead(401).end();
          const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
          if (!user?.admin) return res.writeHead(403).end();

          const { id } = req.body;
          try {
            await prisma.major.deleteMany({ where: { schoolId: id } }); // Cascade delete majors
            await prisma.school.delete({ where: { id } });
            res.writeHead(200).end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(500).end(JSON.stringify({ error: 'Failed to delete school' }));
          }
        }
      });

      // Majors API
      server.middlewares.use('/api/majors', async (req, res) => {
        if (req.method === 'POST') {
          // Admin check
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
          // Admin check
          if (!req.session.userId) return res.writeHead(401).end();
          const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
          if (!user?.admin) return res.writeHead(403).end();

          const { id } = req.body;
          try {
            await prisma.major.delete({ where: { id } });
            res.writeHead(200).end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(500).end(JSON.stringify({ error: 'Failed to delete major' }));
          }
        }
      });

      // Categories API
      server.middlewares.use('/api/categories', async (req, res) => {
        if (req.method === 'GET') {
          const categories = await prisma.category.findMany();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ categories }));
        } else if (req.method === 'POST') {
          // Admin check
          if (!req.session.userId) return res.writeHead(401).end();
          const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
          if (!user?.admin) return res.writeHead(403).end();

          const { value, label } = req.body;
          try {
            const category = await prisma.category.create({ data: { value, label } });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ category }));
          } catch (e) {
            res.writeHead(500).end(JSON.stringify({ error: 'Failed to create category' }));
          }
        } else if (req.method === 'DELETE') {
          // Admin check
          if (!req.session.userId) return res.writeHead(401).end();
          const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
          if (!user?.admin) return res.writeHead(403).end();

          const { id } = req.body;
          try {
            await prisma.category.delete({ where: { id } });
            res.writeHead(200).end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(500).end(JSON.stringify({ error: 'Failed to delete category' }));
          }
        }
      });

      // Admin User Management API
      server.middlewares.use('/api/admin/users', async (req, res) => {
        // Admin check
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
                }
            }
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ users }));
        } else if (req.method === 'POST') { // Actions
          const { action, userId, data } = req.body;
          if (!userId) return res.writeHead(400).end();

          try {
            if (action === 'delete') {
              // Delete related records first if necessary, or rely on cascade if configured (Prisma doesn't cascade by default unless specified in schema, but we didn't add cascade there. We might need to manually clean up.)
              // Minimal cleanup:
              await prisma.registration.deleteMany({ where: { userId } });
              await prisma.session.deleteMany({ where: { userId } });
              // Team cleanup if leader... complex.
              // For now, let's just try to delete the user and see if it fails.
              await prisma.user.delete({ where: { id: userId } });
            } else if (action === 'verify') {
              await prisma.user.update({ where: { id: userId }, data: { verified: true } });
            } else if (action === 'unverify') {
              await prisma.user.update({ where: { id: userId }, data: { verified: false } });
            } else if (action === 'promote') {
              await prisma.user.update({ where: { id: userId }, data: { admin: true } });
            } else if (action === 'demote') {
              await prisma.user.update({ where: { id: userId }, data: { admin: false } });
            }
            res.writeHead(200).end(JSON.stringify({ success: true }));
          } catch (e) {
            console.error(e);
            res.writeHead(500).end(JSON.stringify({ error: 'Action failed' }));
          }
        }
      });

      server.middlewares.use('/api/admin/teams', async (req, res) => {
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
              const { action, teamId } = req.body;
              if (!teamId) return res.writeHead(400).end();

              try {
                  if (action === 'delete') {
                      await prisma.request.deleteMany({ where: { teamId } });
                      await prisma.registration.updateMany({
                          where: { teamId },
                          data: { teamId: null, status: 2 }
                      });
                      await prisma.team.delete({ where: { id: teamId } });
                  }
                  res.writeHead(200).end(JSON.stringify({ success: true }));
              } catch (e) {
                  console.error(e);
                  res.writeHead(500).end(JSON.stringify({ error: 'Action failed' }));
              }
          }
      });

      server.middlewares.use('/api/user', (req, res) => {
        if (req.session.userId) {
          // Fetch user data from the database
          prisma.user.findUnique({
            where: { id: req.session.userId },
          }).then(async user => {
            if (user) {
              if (!user.verified) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'User not verified' }));
                return;
              }
              user.team = await prisma.team.findFirst({
                where: {
                  members: {
                    some: {
                      id: user.id,
                    },
                  },
                },
              });
              user.registration = await prisma.registration.findFirst({
                where: {
                  userId: user.id,
                },
              });
              if (user.team) {
                user.team.members = await prisma.user.findMany({
                  where: {
                    teams: {
                      some: {
                        id: user.team.id,
                      }
                    }
                  }
                });
                if (user.team.leaderId === user.id) {
                  user.team.isLeader = true;
                  user.team.requests = await prisma.request.findMany({
                    where: {
                      teamId: user.team.id,
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
      });
      // Logout Endpoint
      server.middlewares.use('/api/logout', (req, res) => {
        req.session.destroy((err) => {
          if (err) {
            return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Could not log out' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Logout successful' }));
        });
      });

      server.middlewares.use('/api/join', async (req, res) => {
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
        // Check if user is already a member of a team
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
            teamId: null, // Ensure the registration is not already associated with a team
          },
          data: {
            teamId: team.id,
            status: 0, // Assuming 0 means pending
          },
        });
        // Create a request to join the team
        await prisma.request.create({
          data: {
            userId: req.session.userId,
            teamId,
          },
        }).then(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Request sent successfully' }));
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      server.middlewares.use('/api/delete', async (req, res) => {
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
            res.end(JSON.stringify({ message: 'User deleted successfully' }));
          });
        }).catch(err => {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });

      // Mock Registration Endpoint (This should save a hashed password)
      server.middlewares.use('/api/register', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const { accountData, screen0, screen1, screen2 } = req.body;

            const { name, email, password } = accountData;
            const phone = screen0['phone'];
            // console.log(accountData, screen0, screen1, screen2);

            // return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Registration successful' }));

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email: email },
            });

            if (existingUser) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'User already exists' }));
              return;
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 5);

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Send a verification email
            // Create the new user
            const newUser = await prisma.user.create({
              data: {
                name,
                fname: screen0['first-name'],
                lname: screen0['last-name'],
                parents: JSON.stringify(compileParents(screen0)),
                email,
                grade: screen0['grade'].value,
                school: screen0['school'].value,
                major: screen0['major'].value,
                shirt: screen0['shirt'].value,
                phone,
                verificationCode,
                verified: false,
                verificationCodeExpiry: new Date(Date.now() + 60 * 60 * 1000),
                resetPasswordToken: null,
                resetPasswordTokenExpiry: null,
                password: hashedPassword,
              },
            });

            await sgMail.send({
              from: SEND_EMAIL,
              to: email,
              templateId: 'd-7ac09319d3c541afac4e4ff31fe72348',
              dynamicTemplateData: {
                verificationCode,
                name: screen0['first-name']
              },
            }).then(() => {
              console.log('Email sent');
            }).catch((error) => {
              console.error('Error sending email:', error);
            });

            const registration = await createRegistration({
              userId: newUser.id,
              screen1,
              screen2,
            });

            console.log('Registration:', registration);

            req.session.userId = newUser.id;
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Registration successful', user: newUser }));
          } catch (error) {
            console.log(error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request' }));
          }
        }
      });

      server.middlewares.use('/api/createteam', async (req, res) => {
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
            status: 1, // Assuming 1 means accepted
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
        res.end(JSON.stringify({ status: 'success', team }));
      });

      server.middlewares.use('/api/remove', async (req, res) => {
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
                id: user.id,
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
            userId: user.id,
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
                id: user.id,
              },
            },
          },
        });
        await prisma.request.deleteMany({
          where: {
            userId: user.id,
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
              status: 2, // Assuming 2 means removed
            },
          });
          await prisma.team.delete({
            where: {
              id: team.id,
            },
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Team deleted and user removed' }));
        }
        await prisma.user.update(
          {
            where: {
              id: user.id,
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
          res.end(JSON.stringify({ message: 'User removed from the team' }));

          const msg = {
            to: email,
            from: SEND_EMAIL,
            templateId: 'd-2ed060d57af44b0fb2564c0d4251d72a',
            dynamicTemplateData: {
              name: user.name,
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
      });
    },
  };
}

function compileParents(screen0) {
  const parents = [];
  const fields = [['first-name', 'fname'], ['last-name', 'lname'], ['email', 'email'], ['phone', 'phone'], ['relationship', 'relationship']];

  for (let i = 0; i < screen0.parents; i++) {
    const parent = {};
    console.log(screen0);
    fields.forEach(([parse, field]) => {
      parent[field] = screen0[`parent${i + 1}-${parse}`];
    });
    parents.push(parent);
  }

  return parents;
}


async function createRegistration({ userId, screen1, screen2 }) {
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
    //return registration;
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
}