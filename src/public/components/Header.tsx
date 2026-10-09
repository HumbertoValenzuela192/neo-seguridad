import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Brand } from '../../components/Brand';
import { siteURL, type PublicPage } from '../../lib/routes';

export default function Header({ page }: { page: PublicPage }) {
  const neo = page === 'neo';
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [page]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      document.querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')?.focus();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  // "Soluciones" es una sección de Inicio: se resalta mientras esa sección está a la vista.
  const [inSolutions, setInSolutions] = useState(false);
  useEffect(() => {
    setInSolutions(false);
    if (page !== 'home') return;
    const section = document.getElementById('soluciones');
    if (!section || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setInSolutions(entry.isIntersecting), {
      rootMargin: '-40% 0px -50% 0px',
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [page]);
  const links = [
    ['/', 'Inicio'],
    ['/#soluciones', 'Soluciones'],
    ['/neo', 'NEO'],
    ['/central-24-7', 'Central 24/7'],
  ];
  const active = {
    home: inSolutions ? '/#soluciones' : '/',
    neo: '/neo',
    central: '/central-24-7',
    contact: '/contacto',
  }[page];
  const current = (href: string) =>
    active === href ? (href === '/#soluciones' ? 'location' : 'page') : undefined;
  return (
    <header className="site-header">
      <div className="site-container flex min-h-16 items-center justify-between gap-4">
        <Brand neo={neo} />
        <div className="flex items-center gap-3">
          <nav
            className="hidden items-center gap-6 text-sm text-muted lg:flex"
            aria-label="Navegación principal"
          >
            {links.map(([href, label]) => (
              <a
                key={href}
                href={siteURL(href)}
                aria-current={current(href)}
                className={active === href ? 'text-bright' : 'hover:text-bright'}
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            className="button button-primary rounded-full"
            href={siteURL('/contacto')}
            aria-current={page === 'contact' ? 'page' : undefined}
          >
            Contáctanos
          </a>
          <button
            type="button"
            className="button button-secondary size-11 shrink-0 rounded-full p-0 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Navegación móvil"
          className="site-container grid gap-1 border-t border-line py-3 lg:hidden"
        >
          {links.map(([href, label]) => (
            <a
              className="rounded-lg px-3 py-3 text-sm hover:bg-raised"
              key={href}
              href={siteURL(href)}
              aria-current={current(href)}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
