export type ID = string | number;
export type Status = 'nuevo' | 'proceso' | 'atendido';
export type Section =
  | 'inicio'
  | 'solicitudes'
  | 'clientes'
  | 'cuentas'
  | 'usuarios'
  | 'roles'
  | 'precios'
  | 'mensual'
  | 'sueldo';
export interface Session {
  kind: 'user' | 'client';
  id: string;
  name: string;
  sections: Section[];
  portal: boolean;
}
export interface Role {
  id: string;
  name: string;
  sections: Section[];
  portal: boolean;
}
export interface User {
  id: ID;
  usuario: string;
  nombre?: string;
  password?: string;
  rol: string;
  activo?: boolean;
  createdAt?: string;
}
export interface Contact {
  name: string;
  phone: string;
  cargo?: string;
  email?: string;
}
export interface Address {
  address: string;
  lat: number | null;
  lng: number | null;
}
export interface Installation {
  id: ID;
  name: string;
  addresses: Address[];
  hasGuard: string;
  guards: Contact[];
  supervisorName: string;
  supervisorPhone: string;
  supervisorEmail?: string;
  supervisorCargo?: string;
  callOrder: Contact[];
  onboarded: boolean;
  createdAt?: string;
  coreId?: string;
  coreVersion?: number;
  code?: string;
  organizationId?: string | null;
}
export interface Account {
  id: ID;
  name: string;
  user: string;
  pass?: string;
  role: string;
  activo?: boolean;
  source?: string | null;
  sourceId?: ID | null;
  installations?: Installation[];
  installation?: string;
  addresses?: Address[];
  address?: string;
  mapLat?: number | null;
  mapLng?: number | null;
  hasGuard?: string;
  guards?: Contact[];
  supervisorName?: string;
  supervisorPhone?: string;
  callOrder?: Contact[];
  onboarded?: boolean;
  createdAt?: string;
  onboardedAt?: string;
}
export interface Lead {
  id: ID;
  date: string;
  company: string;
  rut: string;
  manager: string;
  email: string;
  phone: string;
  cameras: string;
  operators: string;
  solution: string;
  status: Status;
  implPaid?: boolean;
}
export interface ServiceRequest {
  id: ID;
  date: string;
  client: string;
  accountId?: string;
  type: string;
  typeLabel: string;
  message: string;
  status: Status;
  from?: string;
  to?: string;
  eventAt?: string;
  cameras?: string;
}
export interface Tier {
  qty: string;
  price: string;
}
export interface Task {
  time: string;
  client: string;
  text: string;
  complexity: string;
}
export type Agenda = Record<string, Task[]>;
export interface SalaryParams {
  afp: string;
  salud: string;
  plan: string;
  uf: string;
  cesantia: string;
  jornada: string;
  utm: string;
}
export interface Operator {
  id?: ID;
  name: string;
  cargo: string;
  base: string;
  otros: string;
  noImponibles: string;
  diasTrabajados: string;
  horasAtraso: string;
  horasExtra: string;
  gratificacion: string;
}
export interface DirectoryContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}
export interface DirectoryAddress {
  address: string;
  latitude: number | null;
  longitude: number | null;
}
export interface DirectoryClient {
  id: string;
  version: number;
  code: string;
  name: string;
  external_id?: string;
  organization_id: string | null;
  status: 'pending' | 'ready';
  address: string;
  latitude: number | null;
  longitude: number | null;
  has_guard: boolean;
  addresses: DirectoryAddress[];
  contacts: DirectoryContact[];
  guards: DirectoryContact[];
  supervisor: DirectoryContact;
}
export interface Organization {
  id: string;
  name: string;
}
export interface StoreData {
  neo_solicitudes: Lead[];
  neo_solicitudes_cliente: ServiceRequest[];
  neo_cuentas_cliente: Account[];
  neo_usuarios: User[];
  neo_roles: Role[];
  neo_precios: Tier[];
  neo_implementacion: Tier[];
  neo_uf: number;
  neo_sueldos: Operator[];
  neo_sueldo_params: SalaryParams;
  neo_horario: Agenda;
  neo_datos_instalacion: Record<string, unknown>;
}
export type StoreKey = keyof StoreData;
