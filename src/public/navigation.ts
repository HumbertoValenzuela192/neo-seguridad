import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { matchPublicPath, routeInfo, siteURL, type PublicPage } from '../lib/routes';

const BASE = import.meta.env?.BASE_URL || '/';
const ORIGIN = 'https://tigrrsecurity.cl';

const setMeta = (selector: string, attr: string, value: string) =>
  document.head.querySelector(selector)?.setAttribute(attr, value);

// Mantiene el <head> alineado con la página visible, igual que la versión prerenderizada.
function applyDocument(page: PublicPage) {
  const { path, title, description } = routeInfo(page);
  const neo = page === 'neo';
  const canonical = ORIGIN + path;
  document.title = title;
  document.documentElement.dataset.page = page;
  document.body.classList.toggle('theme-neo', neo);
  setMeta('meta[name="description"]', 'content', description);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[name="twitter:description"]', 'content', description);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('link[rel="canonical"]', 'href', canonical);
  setMeta('meta[property="og:url"]', 'content', canonical);
  setMeta('meta[name="theme-color"]', 'content', neo ? '#111514' : '#140f16');
  setMeta('link[rel="icon"]', 'href', siteURL(neo ? 'neo-globo-icon.png' : 'tigrr.png'));
  const image = ORIGIN + (neo ? '/neo-globo.png' : '/tigrr.png');
  setMeta('meta[property="og:image"]', 'content', image);
  setMeta('meta[name="twitter:image"]', 'content', image);
  const status = document.getElementById('route-status');
  if (status) status.textContent = title;
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function transition(update: () => void) {
  const start = (
    document as Document & { startViewTransition?: (cb: () => void) => unknown }
  ).startViewTransition?.bind(document);
  if (start && !reduced() && !matchMedia('(hover: none), (pointer: coarse)').matches) start(update);
  else update();
}

function afterNavigate(hash: string, y: number | null) {
  if (hash) {
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) {
      target.scrollIntoView({ behavior: 'instant' });
      return;
    }
  }
  window.scrollTo({ top: y ?? 0, behavior: 'instant' });
  const main = document.getElementById('main');
  if (main) {
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  }
}

// Con `true` la barra de direcciones se queda en el dominio principal (tigrrsecurity.cl)
// mientras se navega. Con `false` se muestran las rutas reales (/soluciones, /neo…).
const HIDE_PATHS = true;
const STORE = 'site-page';

type NavState = { page?: PublicPage; y?: number } | null;

/**
 * Navegación del lado del cliente: sin recargar, con transición de vista y la cabecera
 * persistente. Cada ruta sigue prerenderizada y los enlaces conservan su href real, así que
 * buscadores, enlaces directos y "abrir en pestaña nueva" funcionan igual.
 */
export function useSiteNavigation(initial: PublicPage) {
  const [page, setPage] = useState<PublicPage>(initial);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let current = initial;
    const remember = (next: PublicPage) => {
      current = next;
      try {
        sessionStorage.setItem(STORE, next);
      } catch {
        /* almacenamiento no disponible */
      }
    };

    const swap = (next: PublicPage, hash: string, y: number | null) => {
      // El tema (clase del body) se aplica ANTES de montar la página: los efectos de fondo
      // leen su color al montarse y, si no, heredarían el tema de la página anterior.
      // El respaldo de la carga inicial no debe afectar a las páginas que se abren después.
      document.documentElement.classList.remove('hero-failsafe');
      applyDocument(next);
      flushSync(() => {
        setPage(next);
        setCount((n) => n + 1);
      });
      remember(next);
      afterNavigate(hash, y);
    };
    const show = (next: PublicPage, hash: string, y: number | null) =>
      transition(() => swap(next, hash, y));

    // Recargar en una vista interna (la barra muestra sólo el dominio) vuelve a esa vista.
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORE);
    } catch {
      /* almacenamiento no disponible */
    }
    const nav = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    const rootURL = matchPublicPath(location.pathname, BASE) === 'home';
    if (
      HIDE_PATHS &&
      nav?.type === 'reload' &&
      rootURL &&
      stored &&
      stored !== initial &&
      matchPublicPath(routeInfo(stored as PublicPage).path, '/') === stored
    ) {
      applyDocument(stored as PublicPage);
      setPage(stored as PublicPage);
      current = stored as PublicPage;
      history.replaceState({ page: stored, y: 0 }, '', BASE);
    } else {
      remember(initial);
      if (HIDE_PATHS) history.replaceState({ page: initial, y: 0 }, '', BASE);
      else history.replaceState({ page: initial, y: 0 }, '');
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.(
        'a[href]',
      ) as HTMLAnchorElement | null;
      if (!link || link.target || link.hasAttribute('download')) return;
      if (link.origin !== location.origin) return;
      const next = matchPublicPath(link.pathname, BASE);
      if (!next) return;
      if (next === current) {
        event.preventDefault();
        // Misma página: ir a la sección indicada (o arriba) con desplazamiento suave.
        const target = link.hash
          ? document.getElementById(decodeURIComponent(link.hash.slice(1)))
          : null;
        if (target) {
          target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
          if (!HIDE_PATHS) history.replaceState(history.state, '', link.pathname + link.hash);
        } else {
          window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
        }
        return;
      }
      event.preventDefault();
      history.replaceState({ page: current, y: window.scrollY }, '');
      history.pushState(
        { page: next, y: 0 },
        '',
        HIDE_PATHS ? BASE : link.pathname + link.search + link.hash,
      );
      show(next, link.hash, 0);
    };

    const onPop = () => {
      const state = history.state as NavState;
      const next = state?.page ?? matchPublicPath(location.pathname, BASE) ?? 'home';
      show(next, location.hash, state?.y ?? 0);
    };

    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { page, count };
}
