import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { Brand } from '../components/Brand';
import { Button, Field, Form, Loading, Notice, text } from '../components/ui';
import type { Section } from '../types';
import { sectionPath, siteURL } from '../lib/routes';
import { StoreProvider, useStore } from './store';
import { homePathFor } from './nav';
import AppShell from './components/AppShell';

const Dashboard = lazy(() => import('./Dashboard')),
  Commercial = lazy(() => import('./Commercial')),
  Accounts = lazy(() => import('./Accounts')),
  Access = lazy(() => import('./Access')),
  Finance = lazy(() => import('./Finance')),
  Salary = lazy(() => import('./Salary')),
  Client = lazy(() => import('./Client')),
  Directory = lazy(() => import('./Directory')),
  Recovery = lazy(() => import('./Recovery'));

function Guard({ section, children }: { section: Section; children: ReactNode }) {
  const { session } = useStore();
  return session?.sections.includes(section) ? (
    children
  ) : (
    <Navigate to={session ? homePathFor(session) : '/'} replace />
  );
}
function Login() {
  const { login, recoveryPending } = useStore();
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
          <p className="mt-6 text-muted">Gestión interna de Tigrr Security.</p>
        </div>
        <div>
          <a href="https://tigrrsecurity.cl/" className="text-sm text-muted hover:text-bright">
            Volver a Tigrr Security
          </a>
        </div>
      </aside>
      <main className="login-form-wrap">
        <div className="login-form">
          <h2>Iniciar sesión</h2>
          <p className="mb-8 text-sm text-muted">Ingresa con tu cuenta del portal.</p>
          {recoveryPending && (
            <Notice>
              Hay una copia local pendiente de recuperar. Puedes respaldarla desde el enlace
              inferior.
            </Notice>
          )}
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
            href={siteURL('/admin/recuperacion')}
            className="mt-7 block text-xs text-muted underline underline-offset-4"
          >
            Respaldar datos guardados en este navegador
          </a>
        </div>
      </main>
    </div>
  );
}
function Portal() {
  const { session, loading, error, refresh } = useStore(),
    { pathname } = useLocation();
  if (pathname === '/recuperacion' && !session)
    return (
      <div className="min-h-dvh p-5">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex justify-between">
            <Brand neo />
            <a href={siteURL('/admin')} className="button button-secondary">
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
  const fallback = homePathFor(session);
  return (
    <AppShell>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate replace to={fallback} />} />
          <Route
            path="/inicio"
            element={
              <Guard section="inicio">
                <Dashboard />
              </Guard>
            }
          />
          <Route
            path={sectionPath('solicitudes')}
            element={
              <Guard section="solicitudes">
                <Commercial key="leads" />
              </Guard>
            }
          />
          <Route
            path={sectionPath('clientes')}
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
            path={sectionPath('mensual')}
            element={
              <Guard section="mensual">
                <Finance monthly />
              </Guard>
            }
          />
          <Route
            path={sectionPath('sueldo')}
            element={
              <Guard section="sueldo">
                <Salary />
              </Guard>
            }
          />
          <Route
            path="/clientes"
            element={
              <Guard section="cuentas">
                <Directory />
              </Guard>
            }
          />
          <Route
            path="/agenda"
            element={
              <Guard section="inicio">
                <Dashboard agendaOnly />
              </Guard>
            }
          />
          <Route path="/recuperacion" element={<Recovery />} />
          <Route
            path="/portal-cliente"
            element={session.portal ? <Client /> : <Navigate to={fallback} replace />}
          />
          <Route
            path="/sin-acceso"
            element={
              <Notice>Tu cuenta no tiene secciones asignadas. Contacta al administrador.</Notice>
            }
          />
          <Route path="*" element={<Navigate to={fallback} replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename={siteURL('/admin')}>
        <Portal />
      </BrowserRouter>
    </StoreProvider>
  );
}
