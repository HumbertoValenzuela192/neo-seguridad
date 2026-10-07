import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { Button, ConfirmDialog, Notice } from '../../components/ui';
import { navForPath } from '../nav';
import { useStore } from '../store';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import SettingsDialog from './SettingsDialog';

export default function AppShell({ children }: { children: ReactNode }) {
  const { session, logout, error, recoveryPending } = useStore();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false),
    [settings, setSettings] = useState(false),
    [confirmLogout, setConfirmLogout] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null),
    contentRef = useRef<HTMLElement>(null);
  const label =
    navForPath(pathname)?.label ||
    (pathname === '/recuperacion'
      ? 'Recuperación'
      : pathname === '/portal-cliente'
        ? 'Portal cliente'
        : 'Portal');
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
    document.title = `${label} | NEO Seguridad`;
    setOpen(false);
  }, [pathname, label]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null,
      sidebar = sidebarRef.current!,
      overflow = document.body.style.overflow;
    const controls = () =>
      Array.from(sidebar.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)'));
    document.body.style.overflow = 'hidden';
    controls()[0]?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = controls(),
        first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    sidebar.addEventListener('keydown', handle);
    return () => {
      document.body.style.overflow = overflow;
      sidebar.removeEventListener('keydown', handle);
      previous?.focus();
    };
  }, [open]);
  if (!session) return null;
  return (
    <div className={`portal-layout ${pathname === '/portal-cliente' ? '' : 'portal-admin'}`}>
      <a className="skip-link" href="#portal-main">
        Saltar al contenido
      </a>
      {open && (
        <button
          className="portal-nav-backdrop"
          aria-label="Cerrar navegación"
          onClick={() => setOpen(false)}
        />
      )}
      <Sidebar
        open={open}
        sidebarRef={sidebarRef}
        onClose={() => setOpen(false)}
        onSettings={() => {
          setOpen(false);
          setSettings(true);
        }}
        onLogout={() => {
          setOpen(false);
          setConfirmLogout(true);
        }}
      />
      <div className="portal-main-column" inert={open}>
        <header className="portal-topbar">
          <Button
            variant="ghost"
            aria-label="Abrir navegación"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <span className="truncate text-sm text-muted">{label}</span>
        </header>
        <main ref={contentRef} id="portal-main" className="portal-content" tabIndex={-1}>
          {recoveryPending && pathname !== '/recuperacion' && (
            <Notice>
              Hay datos de este navegador pendientes de recuperar.{' '}
              <Link className="underline underline-offset-4" to="/recuperacion">
                Abrir respaldo y recuperación
              </Link>
              .
            </Notice>
          )}
          {error && (
            <Notice error>
              {error} Tus ediciones no se descartan. Si hay un conflicto, copia el borrador antes de
              actualizar.
            </Notice>
          )}
          {children}
        </main>
      </div>
      <MobileNav onOpen={() => setOpen(true)} inert={open} />
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}{' '}
      {confirmLogout && (
        <ConfirmDialog
          title="Cerrar sesión"
          description="¿Quieres salir del portal? Guarda tus cambios antes de continuar."
          onClose={() => setConfirmLogout(false)}
          onConfirm={logout}
        />
      )}
    </div>
  );
}
