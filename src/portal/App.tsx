import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router';
import {
  Camera,
  Check,
  ClipboardList,
  Contact,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Shield,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { Button, Confirm, Field, Form, Loading, Notice, text } from '../components/ui';
import { SECTIONS } from '../lib/domain';
import type { Section } from '../types';
import { StoreProvider, useStore } from './store';

const Dashboard = lazy(() => import('./Dashboard')),
  Commercial = lazy(() => import('./Commercial')),
  Accounts = lazy(() => import('./Accounts')),
  Access = lazy(() => import('./Access')),
  Finance = lazy(() => import('./Finance')),
  Salary = lazy(() => import('./Salary')),
  Client = lazy(() => import('./Client')),
  Directory = lazy(() => import('./Directory')),
  Recovery = lazy(() => import('./Recovery'));
const icons = {
  inicio: LayoutDashboard,
  solicitudes: Contact,
  clientes: ClipboardList,
  cuentas: Users,
  usuarios: Users,
  roles: Shield,
  precios: Camera,
  mensual: Wallet,
  sueldo: FileText,
};
function Guard({ section, children }: { section: Section; children: ReactNode }) {
  const { session } = useStore();
  return session?.sections.includes(section) ? (
    children
  ) : (
    <Navigate
      to={session?.portal ? '/cliente' : `/${session?.sections[0] || 'sin-acceso'}`}
      replace
    />
  );
}
function Login() {
  const { login } = useStore();
  return (
    <div className="login-shell">
      <aside className="login-intro">
        <Brand neo />
        <div>
          <h1>
            Menos ruido.
            <br />
            Más control.
          </h1>
          <p className="mt-6 text-muted">Portal de administración y solicitudes de servicio.</p>
        </div>
        <div>
          <a href="./index.html" className="text-sm text-muted hover:text-bright">
            Volver a Tigrr Security
          </a>
        </div>
      </aside>
      <main className="login-form-wrap">
        <div className="login-form">
          <h2>Iniciar sesión</h2>
          <p className="mb-8 text-sm text-muted">Ingresa con tu cuenta del portal.</p>
          <Form
            label="Ingresar"
            onSave={(form) =>
              login(text(form, 'username'), String(new FormData(form).get('password') || ''))
            }
          >
            <Field label="Usuario">
              <input name="username" autoComplete="username" required />
            </Field>
            <Field label="Contraseña">
              <input name="password" type="password" autoComplete="current-password" required />
            </Field>
          </Form>
          <a
            href="./recover.html"
            className="mt-7 block text-xs text-muted underline underline-offset-4"
          >
            Respaldar datos guardados en este navegador
          </a>
        </div>
      </main>
    </div>
  );
}
function Shell() {
  const sidebarRef = useRef<HTMLElement>(null);
  const { session, loading, saving, error, message, refresh, logout } = useStore(),
    [open, setOpen] = useState(false),
    [confirmLogout, setConfirmLogout] = useState(false),
    location = useLocation();
  const initial = document.documentElement.dataset.page;
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
  const fallback = session?.portal ? '/cliente' : `/${session?.sections[0] || 'sin-acceso'}`;
  const label =
    location.pathname === '/directorio'
      ? 'Clientes compartidos con NEO'
      : location.pathname === '/recuperacion'
        ? 'Recuperación'
        : location.pathname === '/cliente'
          ? 'Portal cliente'
          : SECTIONS.find((s) => '/' + s.key === location.pathname)?.label || 'Portal';
  if (initial === 'recovery' && !session)
    return (
      <div className="min-h-dvh p-5">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex justify-between">
            <Brand neo />
            <a href="./admin.html" className="button button-secondary">
              Iniciar sesión
            </a>
          </div>
          <Suspense fallback={<Loading />}>
            <Recovery />
          </Suspense>
        </div>
      </div>
    );
  if (loading && !session) return <Loading>Cargando tu sesión…</Loading>;
  if (!session)
    return (
      <>
        {error && (
          <div className="p-4">
            <Notice error>{error}</Notice>
            <Button variant="secondary" onClick={() => void refresh().catch(() => {})}>
              Reintentar conexión
            </Button>
          </div>
        )}
        <Login />
      </>
    );
  return (
    <div className="portal-layout">
      <a className="skip-link" href="#portal-main">
        Saltar al contenido
      </a>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-black/60 min-[901px]:hidden"
          aria-label="Cerrar navegación"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`portal-sidebar ${open ? 'mobile-open' : ''}`}
        aria-label="Navegación del portal"
      >
        <div className="mb-5 flex items-center justify-between gap-2">
          <Brand neo />
          <Button
            variant="ghost"
            className="min-[901px]:hidden"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>
        <nav>
          {['Operación', 'Comercial', 'Finanzas', 'Administración'].map((group) => {
            const links = SECTIONS.filter(
              (s) => s.group === group && session.sections.includes(s.key),
            );
            return links.length > 0 ? (
              <div key={group}>
                <h2 className="nav-group">{group}</h2>
                {links.map((s) => {
                  const Icon = icons[s.key];
                  return (
                    <NavLink
                      className="nav-item"
                      to={'/' + s.key}
                      key={s.key}
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={18} />
                      {s.label}
                    </NavLink>
                  );
                })}
                {group === 'Comercial' && session.sections.includes('cuentas') && (
                  <NavLink className="nav-item" to="/directorio" onClick={() => setOpen(false)}>
                    <Contact size={18} />
                    Clientes compartidos
                  </NavLink>
                )}
              </div>
            ) : null;
          })}
          {session.portal && (
            <NavLink className="nav-item" to="/cliente" onClick={() => setOpen(false)}>
              <ClipboardList size={18} />
              Portal cliente
            </NavLink>
          )}
          <h2 className="nav-group">Respaldo</h2>
          <NavLink className="nav-item" to="/recuperacion" onClick={() => setOpen(false)}>
            <Shield size={18} />
            Datos del navegador
          </NavLink>
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <p className="mb-3 px-3 text-xs text-muted">{session.name}</p>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut size={18} />
            Cerrar sesión
          </Button>
          <a href="./index.html" className="nav-item">
            Volver al sitio
          </a>
        </div>
      </aside>
      <div className="min-w-0" inert={open}>
        <header className="portal-topbar">
          <div className="flex items-center gap-3">
            <Button
              className="min-[901px]:hidden"
              variant="ghost"
              aria-label="Abrir navegación"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <span className="text-sm text-muted">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 text-xs text-muted sm:flex" role="status">
              {message === 'Cambios guardados' && <Check size={15} />}
              {saving ? 'Guardando…' : message}
            </span>
            <Button
              variant="ghost"
              aria-label="Actualizar datos del portal"
              disabled={saving || loading}
              onClick={() => void refresh().catch(() => {})}
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </header>
        <main id="portal-main" className="portal-content">
          {error && (
            <Notice error>
              {error} Tus ediciones no se descartan. Si hay un conflicto, copia el borrador antes de
              actualizar.
            </Notice>
          )}
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate
                    replace
                    to={
                      initial === 'directory' && session.sections.includes('cuentas')
                        ? '/directorio'
                        : initial === 'recovery'
                          ? '/recuperacion'
                          : fallback
                    }
                  />
                }
              />
              <Route
                path="/inicio"
                element={
                  <Guard section="inicio">
                    <Dashboard />
                  </Guard>
                }
              />
              <Route
                path="/solicitudes"
                element={
                  <Guard section="solicitudes">
                    <Commercial key="leads" />
                  </Guard>
                }
              />
              <Route
                path="/clientes"
                element={
                  <Guard section="clientes">
                    <Commercial key="requests" requests />
                  </Guard>
                }
              />
              <Route
                path="/cuentas"
                element={
                  <Guard section="cuentas">
                    <Accounts />
                  </Guard>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <Guard section="usuarios">
                    <Access key="users" />
                  </Guard>
                }
              />
              <Route
                path="/roles"
                element={
                  <Guard section="roles">
                    <Access key="roles" roles />
                  </Guard>
                }
              />
              <Route
                path="/precios"
                element={
                  <Guard section="precios">
                    <Finance />
                  </Guard>
                }
              />
              <Route
                path="/mensual"
                element={
                  <Guard section="mensual">
                    <Finance monthly />
                  </Guard>
                }
              />
              <Route
                path="/sueldo"
                element={
                  <Guard section="sueldo">
                    <Salary />
                  </Guard>
                }
              />
              <Route
                path="/directorio"
                element={
                  <Guard section="cuentas">
                    <Directory />
                  </Guard>
                }
              />
              <Route path="/recuperacion" element={<Recovery />} />
              <Route
                path="/cliente"
                element={session.portal ? <Client /> : <Navigate to={fallback} replace />}
              />
              <Route
                path="/sin-acceso"
                element={
                  <Notice>
                    Tu cuenta no tiene secciones asignadas. Contacta al administrador.
                  </Notice>
                }
              />
              <Route path="*" element={<Navigate to={fallback} replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {confirmLogout && (
        <Confirm
          title="Cerrar sesión"
          description="¿Quieres salir del portal? Guarda tus cambios antes de continuar."
          onConfirm={async () => {
            await logout();
            setOpen(false);
          }}
          onClose={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StoreProvider>
  );
}
