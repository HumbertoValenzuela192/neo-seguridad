import { NavLink, useLocation } from 'react-router';
import { ClipboardList, LogOut, Settings, X } from 'lucide-react';
import { asset } from '../../components/Brand';
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
  const { session, recoveryPending } = useStore();
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
        <a
          href={siteURL('/')}
          className="sidebar-brand"
          aria-label="NEO Seguridad · Volver al sitio"
          title="NEO Seguridad"
        >
          <img src={asset('neo-globo-icon.png')} alt="" width="32" height="32" />
        </a>
        <p className="sidebar-user">
          <span>Bienvenido,</span>
          <strong title={session.name}>{session.name}</strong>
        </p>
        <Button
          variant="ghost"
          className="sidebar-icon-action min-[901px]:hidden"
          aria-label="Cerrar menú"
          onClick={onClose}
        >
          <X size={18} />
        </Button>
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
                  title={item.label}
                >
                  <item.icon size={16} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Button
          variant="ghost"
          className="sidebar-icon-action"
          onClick={onSettings}
          aria-label={recoveryPending ? 'Configuración · Respaldo pendiente' : 'Configuración'}
          title={recoveryPending ? 'Configuración · Respaldo pendiente' : 'Configuración'}
          aria-haspopup="dialog"
        >
          <Settings size={16} />
          {recoveryPending && <span className="sidebar-pending-dot" aria-hidden="true" />}
        </Button>
        <Button
          variant="ghost"
          className="sidebar-icon-action"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          aria-haspopup="dialog"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </aside>
  );
}
