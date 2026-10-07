import {
  CalendarDays,
  Camera,
  ClipboardList,
  Contact,
  FileText,
  LayoutDashboard,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Section, Session } from '../types';
import { sectionPath } from '../lib/routes';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  group: string;
  sections: Section[];
  paths?: string[];
  mobile?: boolean;
}
export const NAV: NavItem[] = [
  {
    label: 'Inicio',
    to: sectionPath('inicio'),
    icon: LayoutDashboard,
    group: 'Operación',
    sections: ['inicio'],
    mobile: true,
  },
  {
    label: 'Agenda',
    to: '/agenda',
    icon: CalendarDays,
    group: 'Operación',
    sections: ['inicio'],
    mobile: true,
  },
  {
    label: 'Clientes potenciales',
    to: sectionPath('solicitudes'),
    icon: Contact,
    group: 'Comercial',
    sections: ['solicitudes'],
  },
  {
    label: 'Solicitudes de clientes',
    to: sectionPath('clientes'),
    icon: ClipboardList,
    group: 'Comercial',
    sections: ['clientes'],
  },
  {
    label: 'Clientes compartidos',
    to: '/clientes',
    icon: Contact,
    group: 'Comercial',
    sections: ['cuentas'],
    mobile: true,
  },
  {
    label: 'Cuentas de acceso',
    to: sectionPath('cuentas'),
    icon: Users,
    group: 'Comercial',
    sections: ['cuentas'],
  },
  {
    label: 'Precios por cámaras',
    to: sectionPath('precios'),
    icon: Camera,
    group: 'Finanzas',
    sections: ['precios'],
  },
  {
    label: 'Cálculo mensual',
    to: sectionPath('mensual'),
    icon: Wallet,
    group: 'Finanzas',
    sections: ['mensual'],
  },
  {
    label: 'Sueldos',
    to: sectionPath('sueldo'),
    icon: FileText,
    group: 'Finanzas',
    sections: ['sueldo'],
  },
  {
    label: 'Usuarios y roles',
    to: '/usuarios',
    paths: ['/usuarios', '/roles'],
    icon: Shield,
    group: 'Administración',
    sections: ['usuarios', 'roles'],
  },
];
export const canSee = (item: NavItem, session: Session) =>
  item.sections.some((section) => session.sections.includes(section));
export const navPath = (item: NavItem, session: Session) =>
  item.to === '/usuarios' && !session.sections.includes('usuarios') ? '/roles' : item.to;
export const navForPath = (pathname: string) =>
  NAV.find((item) => (item.paths || [item.to]).includes(pathname));
export const homePathFor = (session: Session) =>
  session.portal
    ? '/portal-cliente'
    : session.sections[0]
      ? sectionPath(session.sections[0])
      : '/sin-acceso';
