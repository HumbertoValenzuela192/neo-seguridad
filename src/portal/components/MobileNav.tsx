import { NavLink } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import { NAV, canSee, navPath } from '../nav';
import { useStore } from '../store';

export default function MobileNav({ onOpen, inert }: { onOpen: () => void; inert: boolean }) {
  const { session } = useStore();
  if (!session) return null;
  const items = NAV.filter((item) => item.mobile && canSee(item, session)).slice(0, 3);
  return (
    <nav className="portal-mobile-nav" aria-label="Accesos principales" inert={inert}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={navPath(item, session)}
          end
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon size={20} />
          <span>{item.to === '/clientes' ? 'Clientes' : item.label}</span>
        </NavLink>
      ))}
      <button className="mobile-nav-item" type="button" onClick={onOpen}>
        <MoreHorizontal size={20} />
        <span>Más</span>
      </button>
    </nav>
  );
}
