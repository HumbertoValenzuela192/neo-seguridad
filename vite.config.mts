import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const base = process.env.PREVIEW_BASE || '/';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'brand-assets',
      generateBundle() {
        for (const file of [
          'tigrr.png',
          'neo-globo.png',
          'neo-globo-icon.png',
          'a2791a37-6fe2-413d-9f5a-526532134dcc.jpg',
        ]) {
          this.emitFile({
            type: 'asset',
            fileName: file,
            source: readFileSync(resolve(root, file)),
          });
        }
      },
    },
  ],
  base,
  server: {
    host: '0.0.0.0',
    hmr: process.env.PREVIEW_BASE ? { path: 'hmr' } : undefined,
    proxy: {
      [`${base}api`]: {
        target: process.env.PORTAL_API_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => (base === '/' ? path : path.slice(base.length - 1)),
      },
    },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        ['index', 'tigrr', 'admin', 'directory', 'recover'].map((name) => [
          name,
          resolve(root, `${name}.html`),
        ]),
      ),
    },
  },
});
