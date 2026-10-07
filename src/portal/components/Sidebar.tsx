import { NavLink, useLocation } from 'react-router';
import { ClipboardList, LogOut, Settings, X } from 'lucide-react';
import { Brand } from '../../components/Brand';
import { Button } from '../../components/ui';
import { siteURL } from '../../lib/routes';
import { NAV, canSee, navPath, type NavItem } from '../nav';
import { useStore } from '../store';
import type { RefObject } from 'react';

export default function Sidebar({
  open,
  sidebarRef,
  onClose,
  onSettings,
  onLogout,
}: {
  open: boolean;
  sidebarRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const { session, message, saving, recoveryPending } = useStore();
  const { pathname } = useLocation();
  if (!session) return null;
  const items = NAV.filter((item) => canSee(item, session));
  if (session.portal)
    items.push({
      label: 'Portal cliente',
      to: '/portal-cliente',
      group: 'Servicio',
      icon: ClipboardList,
      sections: [],
    } as NavItem);
  return (
    <aside
      ref={sidebarRef}
      className={`portal-sidebar ${open ? 'mobile-open' : ''}`}
      aria-label="Navegación del portal"
    >
      <div className="sidebar-header">
        <div className="flex items-center justify-between gap-2">
          <Brand neo />
          <Button
            variant="ghost"
            className="min-[901px]:hidden"
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>
        <p className="sidebar-user">
          Bienvenido, <strong>{session.name}</strong>
        </p>
      </div>
      <nav className="sidebar-navigation">
        {[...new Set(items.map((item) => item.group))].map((group) => (
          <div key={group}>
            <h2 className="nav-group">{group}</h2>
            {items
              .filter((item) => item.group === group)
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.paths?.includes(pathname) ? pathname : navPath(item, session)}
                  className={({ isActive }) =>
                    `nav-item ${isActive || item.paths?.includes(pathname) ? 'active' : ''}`
                  }
                  aria-current={item.paths?.includes(pathname) ? 'page' : undefined}
                  end
                  onClick={onClose}
                >
                  <item.icon size={18} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p className="sidebar-save-state" role="status">
          {saving ? 'Guardando cambios…' : message || 'Sesión activa'}
        </p>
        <Button variant="ghost" className="w-full justify-start" onClick={onSettings}>
          <Settings size={18} />
          Configuración{recoveryPending && <span className="badge badge-warning">Pendiente</span>}
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
          <LogOut size={18} />
          Cerrar sesión
        </Button>
        <a href={siteURL('/')} className="nav-item">
          Volver al sitio
        </a>
      </div>
    </aside>
  );
}
