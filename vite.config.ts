import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      /*
       * Proxy /api to the dev server during development, so the browser
       * sees one origin and there is no CORS to configure. In production
       * nginx does the same job, which is why every fetch in this app
       * uses a relative URL.
       *
       * Plain HTTP straight to srv-dev on 8081, deliberately bypassing
       * nginx: Node rejects the self-signed certificate, and working
       * around that here would be noise.
       */
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
