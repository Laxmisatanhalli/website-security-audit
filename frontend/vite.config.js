import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only proxy: forwards API calls to the Express backend so the
// frontend can use relative paths (e.g. '/websites') that work unchanged
// once this build is served by Express itself in production. Cookies are
// forwarded automatically since changeOrigin doesn't strip them.
const BACKEND_PATHS = ['/api/auth', '/api/websites', '/api/scans', '/api/dashboard', '/api/reports', '/api/notifications', '/api/users', '/api/settings'];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(
      BACKEND_PATHS.map((p) => [
        p,
        { target: 'http://localhost:3000', changeOrigin: true },
      ])
    ),
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
});
