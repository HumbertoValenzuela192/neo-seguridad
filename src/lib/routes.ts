import routes from '../../routes.json';
export type PublicPage = 'home' | 'solutions' | 'neo' | 'central' | 'contact';
export const siteURL = (path = '/') => (import.meta.env?.BASE_URL || '/') + path.replace(/^\//, '');
export function publicPage(pathname: string, base = '/') {
  const path = '/' + pathname.slice(base.length).replace(/^\//, '').replace(/\/$/, '');
  return (routes.publicPages.find(page => page.path === path)?.page as PublicPage) || 'home';
}
export function legacyPublicPath(hash: string) {
  return routes.legacyPublicHashes[hash as keyof typeof routes.legacyPublicHashes] || null;
}
