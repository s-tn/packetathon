// vite-plugin-auth.ts
import { Plugin } from 'vite';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import expressSession from 'express-session';
import { c } from 'vite/dist/node/moduleRunnerTransport.d-CXw_Ws6P';

// Prisma Client instance
const prisma = new PrismaClient();

const users = [
  { email: 'test@example.com', password: 'password123' }, // Mock users
];

export default function createAuthPlugin(): Plugin {
  return {
    name: 'vite-plugin-auth',
    configureServer(server) {
      // Setup express-session
      server.middlewares.use(expressSession({
        secret: 'secret-key', // use a more secure secret for production
        resave: false,
        saveUninitialized: false,
      }));

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
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ loggedIn: true }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ loggedIn: false }));
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

      // Mock Registration Endpoint (This should save a hashed password)
      server.middlewares.use('/api/register', async (req, res) => {
        if (req.method === 'POST') {
          try {
            const { accountData, screen0, screen1, screen2 } = req.body;

            const { name, email, password } = accountData;
            console.log(accountData, screen0, screen1, screen2);

            // return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Registration successful' }));

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email },
            });
            if (existingUser) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'User already exists' }));
              return;
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the new user
            const newUser = await prisma.user.create({
              data: {
                name,
                email,
                password: hashedPassword,
              },
            });

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User created', user: newUser }));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request' }));
          }
        }
      });
    },
  };
}
