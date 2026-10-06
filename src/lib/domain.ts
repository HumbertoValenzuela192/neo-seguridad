import type { Account, Installation, Operator, Role, SalaryParams, Section, Tier } from '../types';
export const SECTIONS: { key: Section; label: string; group: string }[] = [
  { key: 'inicio', label: 'Inicio y agenda', group: 'Operación' },
  { key: 'solicitudes', label: 'Clientes potenciales', group: 'Comercial' },
  { key: 'clientes', label: 'Solicitudes de clientes', group: 'Comercial' },
  { key: 'cuentas', label: 'Cuentas del cliente', group: 'Comercial' },
  { key: 'precios', label: 'Precios por cámaras', group: 'Finanzas' },
  { key: 'mensual', label: 'Cálculo mensual', group: 'Finanzas' },
  { key: 'sueldo', label: 'Sueldos', group: 'Finanzas' },
  { key: 'usuarios', label: 'Usuarios', group: 'Administración' },
  { key: 'roles', label: 'Roles', group: 'Administración' },
];
export const DEFAULT_ROLES: Role[] = [
  { id: 'admin', name: 'Administrador', sections: SECTIONS.map((s) => s.key), portal: false },
  { id: 'cliente', name: 'Cliente', sections: [], portal: true },
];
export const DEFAULT_PRICES: Tier[] = ['1 a 10', '11 a 30', '31 a 60', 'Más de 60'].map((qty) => ({
  qty,
  price: '',
}));
export const DEFAULT_IMPL: Tier[] = [
  ['1 a 5', '3'],
  ['6 a 15', '5'],
  ['16 a 25', '7'],
  ['26 a 50', '10'],
  ['51 a 100', '15'],
  ['101 a 199', '20'],
  ['200 o más', '25'],
].map(([qty, price]) => ({ qty, price }));
export const DEFAULT_SALARY: SalaryParams = {
  afp: 'capital',
  salud: 'fonasa',
  plan: '0',
  uf: '0',
  cesantia: '0,6',
  jornada: '45',
  utm: '0',
};
export const AFP: Record<string, { name: string; comision: number }> = {
  capital: { name: 'Capital', comision: 1.44 },
  cuprum: { name: 'Cuprum', comision: 1.44 },
  habitat: { name: 'Habitat', comision: 1.27 },
  modelo: { name: 'Modelo', comision: 0.58 },
  planvital: { name: 'PlanVital', comision: 1.16 },
  provida: { name: 'Provida', comision: 1.45 },
  uno: { name: 'Uno', comision: 0.49 },
};
export const STATUS = { nuevo: 'Nuevo', proceso: 'En proceso', atendido: 'Atendido' };
export const nowLabel = () =>
  new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const clp = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CL');
export const uf = (n: number) =>
  (n || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' UF';
// Legacy decimal strings use a comma; accept a decimal point for new numeric inputs too.
export function number(value: unknown) {
  const clean = String(value ?? '')
    .trim()
    .replace(/\s/g, '');
  return Number(clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean) || 0;
}
export function parseRange(text: string) {
  const values = text.match(/\d+/g)?.map(Number);
  if (!values?.length) return null;
  if (/o m[áa]s|\+/.test(text.toLowerCase())) return { min: values[0], max: Infinity };
  if (/m[áa]s de/.test(text.toLowerCase())) return { min: values[0] + 1, max: Infinity };
  return { min: values[0], max: values[1] ?? values[0] };
}
export function findTier(tiers: Tier[], cameras: number) {
  return tiers.find((t) => {
    const r = parseRange(t.qty);
    return r && cameras >= r.min && cameras <= r.max;
  });
}
export function newInstallation(): Installation {
  return {
    id: crypto.randomUUID(),
    name: '',
    addresses: [{ address: '', lat: null, lng: null }],
    hasGuard: '',
    guards: [],
    supervisorName: '',
    supervisorPhone: '',
    callOrder: [{ name: '', phone: '', cargo: '', email: '' }],
    onboarded: false,
    createdAt: nowLabel(),
  };
}
export function installations(account: Account): Installation[] {
  const list: Partial<Installation>[] = account.installations?.length
    ? account.installations
    : [
        {
          id: 'primary',
          name: account.installation || '',
          addresses:
            account.addresses ||
            (account.address
              ? [
                  {
                    address: account.address,
                    lat: account.mapLat ?? null,
                    lng: account.mapLng ?? null,
                  },
                ]
              : []),
          hasGuard: account.hasGuard || '',
          guards: account.guards || [],
          supervisorName: account.supervisorName || '',
          supervisorPhone: account.supervisorPhone || '',
          callOrder: (account.callOrder || []).map((c) =>
            typeof c === 'string' ? { name: c, phone: '' } : c,
          ),
          onboarded: !!account.onboarded,
        },
      ];
  const contacts = (items: Installation['callOrder'] | undefined) =>
    (items || []).map((c) =>
      typeof c === 'string'
        ? { name: c, phone: '', cargo: '', email: '' }
        : {
            ...c,
            name: c.name || '',
            phone: c.phone || '',
            cargo: c.cargo || '',
            email: c.email || '',
          },
    );
  return list.map((inst) => ({
    ...inst,
    id: inst.id || 'primary',
    name: inst.name || '',
    addresses: (inst.addresses || []).map((a) => ({
      ...a,
      address: a.address || '',
      lat: a.lat ?? null,
      lng: a.lng ?? null,
    })),
    hasGuard: inst.hasGuard || '',
    guards: contacts(inst.guards),
    callOrder: contacts(inst.callOrder),
    supervisorName: inst.supervisorName || '',
    supervisorPhone: inst.supervisorPhone || '',
    onboarded: !!inst.onboarded,
  }));
}
export function installationReady(i: Installation) {
  return !!(
    i.onboarded &&
    i.name &&
    i.addresses.some((a) => a.address) &&
    i.callOrder.length &&
    i.callOrder.every((c) => c.name && c.phone) &&
    (i.hasGuard === 'no' ||
      (i.hasGuard === 'si' &&
        i.guards.length &&
        i.guards.every((g) => g.name && g.phone) &&
        i.supervisorName &&
        i.supervisorPhone))
  );
}
export function validRut(value: string) {
  const rut = value.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;
  let sum = 0,
    m = 2;
  for (const digit of rut.slice(0, -1).split('').reverse()) {
    sum += Number(digit) * m;
    m = m === 7 ? 2 : m + 1;
  }
  const dv = 11 - (sum % 11);
  return rut.at(-1) === (dv === 11 ? '0' : dv === 10 ? 'K' : String(dv));
}
export function computeOperator(op: Operator, params: SalaryParams) {
  const afpRate = 10 + (AFP[params.afp]?.comision || 0),
    jornada = number(params.jornada) || 45,
    base = number(op.base);
  const dias =
    op.diasTrabajados == null || op.diasTrabajados === '' ? 30 : number(op.diasTrabajados);
  const valorHora = base > 0 && jornada > 0 ? base / 30 / (jornada / 6) : 0;
  const baseProporcional = Math.round((base * Math.min(Math.max(dias, 0), 30)) / 30),
    descuentoAtraso = Math.round(valorHora * number(op.horasAtraso)),
    pagoHorasExtra = Math.round(valorHora * 1.5 * number(op.horasExtra)),
    gratificacion = number(op.gratificacion);
  const imponibles = Math.max(
      0,
      baseProporcional - descuentoAtraso + number(op.otros) + pagoHorasExtra + gratificacion,
    ),
    noImponibles = number(op.noImponibles),
    bruto = imponibles + noImponibles;
  const descAfp = Math.round((imponibles * afpRate) / 100),
    descSalud = Math.max(
      Math.round(imponibles * 0.07),
      params.salud === 'isapre' ? Math.round(number(params.plan) * number(params.uf)) : 0,
    ),
    descCesantia = Math.round((imponibles * number(params.cesantia)) / 100);
  const descuentos = descAfp + descSalud + descCesantia;
  return {
    afpRate,
    baseProporcional,
    descuentoAtraso,
    pagoHorasExtra,
    gratificacion,
    imponibles,
    noImponibles,
    bruto,
    descAfp,
    descSalud,
    descCesantia,
    descuentos,
    liquido: bruto - descuentos,
  };
}
