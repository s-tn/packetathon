import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { sgMail, SEND_EMAIL } from '../mail';
import { compileParents, createRegistration } from '../helpers';
import type { RouteDefinition } from '../types';

const routes: RouteDefinition[] = [
  {
    path: '/api/login',
    handler: async (req, res) => {
      if (req.method === 'POST') {
        try {
          const { email, password } = req.body;

          console.log(email, password);

          const user = await prisma.user.findUnique({
            where: { email },
          });

          console.log(user);

          if (!user || !(bcrypt.compareSync(password, user.password))) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid email or password' }));
            return;
          }

          req.session.userId = user.id;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ user }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      }
    },
  },
  {
    path: '/api/register',
    handler: async (req, res) => {
      if (req.method === 'POST') {
        try {
          const { accountData, screen0, screen1, screen2 } = req.body;

          const { name, email, password } = accountData;
          const phone = screen0['phone'];

          // Check if school allows self-registration
          const schoolValue = screen0['school']?.value || screen0['school'];
          if (schoolValue) {
            const schoolRecord = await prisma.school.findUnique({ where: { value: schoolValue } });
            if (schoolRecord && !schoolRecord.allowSelfRegistration) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Self-registration is disabled for this school. Please contact your school administrator.' }));
              return;
            }
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: email },
          });

          if (existingUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User already exists' }));
            return;
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
          res.end(JSON.stringify({ user: newUser }));
        } catch (error) {
          console.log(error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      }
    },
  },
  {
    path: '/api/verify',
    handler: (req, res) => {
      const { code } = req.body;
      const userId = req.session.userId;

      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not logged in' }));
        return;
      }

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

        prisma.user.update({
          where: { id: userId },
          data: {
            verified: true,
          },
        }).then(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({}));
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
    },
  },
  {
    path: '/api/resend',
    handler: (req, res) => {
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
          res.end(JSON.stringify({}));
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
    },
  },
  {
    path: '/api/forgot-password',
    handler: (req, res) => {
      const { email } = req.body;
      if (!email) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email is required' }));
        return;
      }

      if (req.session.nextCode && new Date(req.session.nextCode) > new Date()) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Please wait before requesting a new code' }));
        return;
      }

      prisma.user.findUnique({
        where: { email },
      }).then(async user => {
        if (!user) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({}));
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
          res.end(JSON.stringify({}));
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
    },
  },
  {
    path: '/api/resend-reset',
    handler: (req, res) => {
      const { token } = req.body;
      console.log(token);
      if (!token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token is required' }));
        return;
      }

      if (req.session.nextCode && new Date(req.session.nextCode) > new Date()) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Please wait before requesting a new code' }));
        return;
      }

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
          res.end(JSON.stringify({}));
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
    },
  },
  {
    path: '/api/reset',
    handler: (req, res) => {
      const { token, password } = req.body;
      if (!token || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token and password are required' }));
        return;
      }
      prisma.user.findUnique({
        where: { resetPasswordToken: token },
      }).then(async user => {
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }
        if (new Date() > user.resetPasswordTokenExpiry!) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Reset token expired' }));
          return;
        }
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
        res.end(JSON.stringify({}));
      }).catch(err => {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      });
    },
  },
  {
    path: '/api/check-login',
    handler: async (req, res) => {
      if (req.session.userId) {
        const userId = req.session.userId;
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });
          if (user) {
            const schoolAdminAssignments = await prisma.schoolAdmin.findMany({
              where: { userId },
              include: { school: true },
            });
            const isSchoolAdmin = schoolAdminAssignments.length > 0;
            const adminSchools = schoolAdminAssignments.map(a => a.school);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ loggedIn: true, user: { ...user, isSchoolAdmin, adminSchools } }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ loggedIn: false }));
          }
        } catch (err) {
          console.error(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ loggedIn: false }));
      }
    },
  },
  {
    path: '/api/logout',
    handler: (req, res) => {
      req.session.destroy((err) => {
        if (err) {
          return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Could not log out' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({}));
      });
    },
  },
];

export default routes;
