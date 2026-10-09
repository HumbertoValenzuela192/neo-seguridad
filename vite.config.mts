import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import routes from './routes.json' with { type: 'json' };
import type { IncomingMessage, ServerResponse } from 'node:http';
const root = fileURLToPath(new URL('.', import.meta.url));
const base = process.env.PREVIEW_BASE || '/';
const publicRoutes = new Map(routes.publicPages.map((page) => [page.path, page]));
function routeMiddleware(preview = false) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (!url.pathname.startsWith(base)) {
      next();
      return;
    }
    const path = '/' + url.pathname.slice(base.length);
    const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
    const redirect = Object.hasOwn(routes.redirects, path)
      ? routes.redirects[path as keyof typeof routes.redirects]
      : path !== normalized && publicRoutes.has(normalized)
        ? normalized
        : null;
    if (redirect) {
      const [target, hash] = redirect.split('#');
      res.writeHead(308, {
        Location: base + target.slice(1) + url.search + (hash ? '#' + hash : ''),
      });
      res.end();
      return;
    }
    const page = publicRoutes.get(path);
    if (page)
      req.url =
        base +
        (preview ? page!.file : page!.page === 'neo' ? 'tigrr.html' : 'index.html') +
        url.search;
    next();
  };
}
const cleanRoutes: Plugin = {
  name: 'clean-routes',
  configureServer(server) {
    server.middlewares.use(routeMiddleware());
  },
  configurePreviewServer(server) {
    server.middlewares.use(routeMiddleware(true));
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cleanRoutes,
    {
      name: 'brand-assets',
      generateBundle() {
        for (const file of [
          'tigrr.png',
          'tigrr-dark.svg',
          'neo-globo.png',
          'neo-globo-icon.png',
          'neo-globo-metal.svg',
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
        target: process.env.PUBLIC_API_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => (base === '/' ? path : path.slice(base.length - 1)),
      },
    },
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        ['index', 'tigrr'].map((name) => [name, resolve(root, `${name}.html`)]),
      ),
    },
  },
});
