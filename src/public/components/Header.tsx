import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Brand } from '../../components/Brand';
import { siteURL, type PublicPage } from '../../lib/routes';

function Country() {
  const [country, setCountry] = useState<{ name: string; code: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      for (const url of [
        'https://ipwho.is/',
        'https://get.geojs.io/v1/ip/country.json',
        'https://api.country.is/',
      ]) {
        try {
          const response = await fetch(url, { signal: controller.signal });
          const d = await response.json();
          const code = d.country_code || d.country;
          if (response.ok && d.success !== false && /^[a-z]{2}$/i.test(code)) {
            setCountry({ name: d.name || d.country || code, code });
            return;
          }
        } catch {
          if (controller.signal.aborted) return;
        }
      }
    })();
    return () => controller.abort();
  }, []);
  return country ? (
    <span className="hidden items-center gap-2 text-xs text-muted xl:flex">
      <img
        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
        alt=""
        width="20"
        height="15"
      />
      {country.name}
    </span>
  ) : null;
}

export default function Header({ page }: { page: PublicPage }) {
  const neo = page === 'neo';
  const [open, setOpen] = useState(false);
  const links = [
    ['/', 'Inicio'],
    ['/soluciones', 'Soluciones'],
    ['/neo', 'NEO'],
    ['/central-24-7', 'Central 24/7'],
    ['/contacto', 'Contacto'],
  ];
  const active = {
    home: '/',
    solutions: '/soluciones',
    neo: '/neo',
    central: '/central-24-7',
    contact: '/contacto',
  }[page];
  return (
    <header className="site-header">
      <div className="site-container flex min-h-18 items-center justify-between gap-4">
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
                aria-current={active === href ? 'page' : undefined}
                className={active === href ? 'text-bright' : 'hover:text-bright'}
              >
                {label}
              </a>
            ))}
          </nav>
          <Country />
          <a className="button button-primary rounded-full" href={siteURL('/contacto')}>
            {neo ? 'Contáctanos' : 'Evaluación'}
          </a>
          <button
            type="button"
            className="button button-secondary lg:hidden"
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
              aria-current={active === href ? 'page' : undefined}
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
