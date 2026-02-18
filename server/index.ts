import { Plugin } from 'vite';
import expressSession from 'express-session';
import { seedData } from './seed';
import type { RouteDefinition } from './types';

import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import adminRoutes from './routes/admin';
import dataRoutes from './routes/data';
import exportRoutes from './routes/exports';
import userRoutes from './routes/user';
import schoolAdminRoutes from './routes/school-admin';

const allRoutes: RouteDefinition[] = [
  ...authRoutes,
  ...teamRoutes,
  ...adminRoutes,
  ...dataRoutes,
  ...exportRoutes,
  ...userRoutes,
  ...schoolAdminRoutes,
];

export default function createAuthPlugin(): Plugin {
  return {
    name: 'vite-plugin-auth',
    configureServer(server) {
      server.middlewares.use(expressSession({
        secret: 'secret-key',
        resave: false,
        saveUninitialized: false,
      }) as any);

      for (const route of allRoutes) {
        server.middlewares.use(route.path, route.handler as any);
      }

      seedData();
    },
  };
}
