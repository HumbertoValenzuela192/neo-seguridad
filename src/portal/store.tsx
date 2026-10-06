import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, StoreData, StoreKey } from '../types';
import { APIError, errorMessage, request } from '../lib/api';
import { DEFAULT_IMPL, DEFAULT_PRICES, DEFAULT_ROLES, DEFAULT_SALARY } from '../lib/domain';
import { preserveBrowserData, recoverBeforeLoad, type BrowserBackup } from '../lib/recovery';

const defaults: StoreData = {
  neo_solicitudes: [],
  neo_solicitudes_cliente: [],
  neo_cuentas_cliente: [],
  neo_usuarios: [],
  neo_roles: DEFAULT_ROLES,
  neo_precios: DEFAULT_PRICES,
  neo_implementacion: DEFAULT_IMPL,
  neo_uf: 39000,
  neo_sueldos: [],
  neo_sueldo_params: DEFAULT_SALARY,
  neo_horario: {},
  neo_datos_instalacion: {},
};
interface StoreContext {
  session: Session | null;
  data: StoreData;
  loading: boolean;
  saving: boolean;
  message: string;
  error: string;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  save<K extends StoreKey>(key: K, value: StoreData[K]): Promise<void>;
}
const Context = createContext<StoreContext | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [data, setData] = useState(defaults),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const versions = useRef<Partial<Record<StoreKey, string>>>({}),
    busy = useRef(false),
    backup = useRef<BrowserBackup | null>(null),
    started = useRef(false);
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const me = await request<Session>('/auth/me');
      await recoverBeforeLoad(me, backup.current);
      const raw = await request<
        Record<string, string> & { __versions: Partial<Record<StoreKey, string>> }
      >('/db');
      const next = structuredClone(defaults);
      for (const key of Object.keys(defaults) as StoreKey[]) {
        if (raw[key] !== undefined) {
          const value: unknown = JSON.parse(raw[key]);
          const valid = Array.isArray(defaults[key])
            ? Array.isArray(value)
            : typeof defaults[key] === 'number'
              ? typeof value === 'number' && Number.isFinite(value)
              : value !== null && typeof value === 'object' && !Array.isArray(value);
          if (!valid)
            throw new Error(
              `Los datos de ${key} tienen un formato inesperado. Se conservaron sin cambios.`,
            );
          (next as unknown as Record<string, unknown>)[key] = value;
        }
      }
      if (!next.neo_roles.length) next.neo_roles = structuredClone(DEFAULT_ROLES);
      next.neo_sueldo_params = { ...DEFAULT_SALARY, ...next.neo_sueldo_params };
      versions.current = raw.__versions || {};
      setData(next);
      setSession(me);
      setMessage('');
    } catch (e) {
      if (e instanceof APIError && e.status === 401) {
        setSession(null);
        setData(structuredClone(defaults));
        versions.current = {};
      } else {
        setError(errorMessage(e));
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try {
      backup.current = preserveBrowserData();
    } catch (e) {
      setError(
        'No se pudo leer el respaldo local. Expórtalo desde Recuperación antes de continuar. ' +
          errorMessage(e),
      );
      setLoading(false);
      return;
    }
    void refresh().catch(() => {});
  }, []);
  async function save<K extends StoreKey>(key: K, value: StoreData[K]) {
    if (busy.current) throw new Error('Hay un guardado en curso. Espera a que termine.');
    busy.current = true;
    setSaving(true);
    setError('');
    setMessage('Guardando cambios…');
    try {
      const result = await request<{ value: string; version: string }>(`/store/${key}`, 'PUT', {
        value: JSON.stringify(value),
        version: versions.current[key],
      });
      versions.current[key] = result.version;
      setData((previous) => ({ ...previous, [key]: JSON.parse(result.value) }));
      setMessage('Cambios guardados');
      if (key === 'neo_cuentas_cliente') {
        // Core versions change on every edit; use its projection before the next save.
        try {
          const latest = await request<{
            neo_cuentas_cliente: string;
            __versions: Partial<Record<StoreKey, string>>;
          }>('/db');
          versions.current.neo_cuentas_cliente = latest.__versions.neo_cuentas_cliente;
          setData((previous) => ({
            ...previous,
            neo_cuentas_cliente: JSON.parse(latest.neo_cuentas_cliente),
          }));
        } catch {
          setMessage('Guardado. Actualiza para obtener la versión de NEO.');
        }
      }
    } catch (e) {
      setError(errorMessage(e));
      setMessage('Cambios sin confirmar');
      throw e;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function login(username: string, password: string) {
    await request('/auth/login', 'POST', { username, password });
    await refresh();
  }
  async function logout() {
    await request('/auth/logout', 'POST', {});
    setSession(null);
    setData(structuredClone(defaults));
    versions.current = {};
    setError('');
    setMessage('');
    sessionStorage.removeItem('neo_directory_imported');
  }
  return (
    <Context.Provider
      value={{ session, data, loading, saving, message, error, login, logout, refresh, save }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const context = useContext(Context);
  if (!context) throw new Error('StoreProvider requerido.');
  return context;
}
