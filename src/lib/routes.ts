import routes from '../../routes.json';
import type { Section } from '../types';

export type PublicPage = 'home' | 'solutions' | 'neo' | 'central' | 'contact';
export const siteURL = (path = '/') => (import.meta.env?.BASE_URL || '/') + path.replace(/^\//, '');
export const sectionPath = (section: Section) => '/' + routes.portalSections[section];
export function publicPage(pathname: string, base = '/') {
  const path = '/' + pathname.slice(base.length).replace(/^\//, '').replace(/\/$/, '');
  return (routes.publicPages.find((page) => page.path === path)?.page as PublicPage) || 'home';
}
export function legacyPortalPath(hash: string) {
  if (!hash.startsWith('#/')) return null;
  const [oldPath, query] = hash.slice(2).split('?');
  const section = oldPath.replace(/\/$/, '');
  const path = Object.hasOwn(routes.portalSections, section)
    ? sectionPath(section as Section)
    : section === 'directorio'
      ? '/clientes'
      : section === 'cliente'
        ? '/portal-cliente'
        : ['recuperacion', 'sin-acceso'].includes(section)
          ? '/' + section
          : '/';
  return path + (query ? '?' + query : '');
}
export function legacyPublicPath(hash: string) {
  return routes.legacyPublicHashes[hash as keyof typeof routes.legacyPublicHashes] || null;
}
