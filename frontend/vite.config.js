import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only proxy: forwards API calls to the Express backend so the
// frontend can use relative paths (e.g. '/api/websites') that work
// unchanged once this build is served by Express itself in production.
// Backend routes are mounted under /api (see src/app.js), so a single
// '/api' proxy entry covers everything. Cookies pass through automatically
// since changeOrigin doesn't strip them.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: `http://localhost:${process.env.BACKEND_PORT || 3000}`, changeOrigin: true },
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
});