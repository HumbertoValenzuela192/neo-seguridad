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
const portalRoutes = new Set([
  '/admin',
  ...Object.values(routes.portalSections).map((slug) => '/admin/' + slug),
  ...routes.portalExtra.map((slug) => '/admin/' + slug),
]);
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
      : path !== normalized && (publicRoutes.has(normalized) || portalRoutes.has(normalized))
        ? normalized
        : null;
    if (redirect) {
      res.writeHead(308, { Location: base + redirect.slice(1) + url.search });
      res.end();
      return;
    }
    const page = publicRoutes.get(path);
    if (page || portalRoutes.has(path))
      req.url =
        base +
        (portalRoutes.has(path)
          ? 'admin.html'
          : preview
            ? page!.file
            : page!.page === 'neo'
              ? 'tigrr.html'
              : 'index.html') +
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
    manifest: true,
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
