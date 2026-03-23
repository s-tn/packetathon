import express from 'express';
import expressSession from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './seed';
import type { RouteDefinition } from './types';

import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import adminRoutes from './routes/admin';
import dataRoutes from './routes/data';
import exportRoutes from './routes/exports';
import userRoutes from './routes/user';
import schoolAdminRoutes from './routes/school-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(__dirname, '../dist/client');

const allRoutes: RouteDefinition[] = [
  ...authRoutes,
  ...teamRoutes,
  ...adminRoutes,
  ...dataRoutes,
  ...exportRoutes,
  ...userRoutes,
  ...schoolAdminRoutes,
];

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));

for (const route of allRoutes) {
  app.use(route.path, route.handler as any);
}

app.use(express.static(clientDir));

// SPA fallback for /signup routes
app.use('/signup', (_req, res) => {
  res.sendFile(path.join(clientDir, 'signup.html'));
});

app.use((_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

seedData();

const PORT = parseInt(process.env.PORT || '5173');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
