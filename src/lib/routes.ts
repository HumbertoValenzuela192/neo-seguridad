import routes from '../../routes.json';
export type PublicPage = 'home' | 'neo' | 'central' | 'contact';
export const siteURL = (path = '/') => (import.meta.env?.BASE_URL || '/') + path.replace(/^\//, '');
export function publicPage(pathname: string, base = '/') {
  const path = '/' + pathname.slice(base.length).replace(/^\//, '').replace(/\/$/, '');
  return (routes.publicPages.find((page) => page.path === path)?.page as PublicPage) || 'home';
}
export function legacyPublicPath(hash: string) {
  return routes.legacyPublicHashes[hash as keyof typeof routes.legacyPublicHashes] || null;
}
export function matchPublicPath(pathname: string, base = '/'): PublicPage | null {
  if (!pathname.startsWith(base)) return null;
  const path = '/' + pathname.slice(base.length).replace(/^\//, '').replace(/\/$/, '');
  return (routes.publicPages.find((page) => page.path === path)?.page as PublicPage) || null;
}
export function routeInfo(page: PublicPage) {
  const info = routes.publicPages.find((route) => route.page === page) ?? routes.publicPages[0];
  return { path: info.path, title: info.title, description: info.description };
}
