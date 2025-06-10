import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from '@tailwindcss/vite';
import apiRoutes from "vite-plugin-api-routes";
import authPlugin from './vite-plugin-auth'
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    solidPlugin(), tailwindcss(),
    apiRoutes({
      // Configuration options go here
    }),
    authPlugin(),
    {
      name: 'rewrite-middleware',
      configureServer(serve) {
        serve.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/signup/')) {
            req.url = '/signup';
          }
          next()
        })
      }
    }
  ],
  build: {
    target: 'esnext',
    polyfillDynamicImport: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  },
  appType: 'spa',
  server: { 
    allowedHosts: ['linearfunctions.net', 'signup.bthackathon.com', 'localhost']
  }
});
