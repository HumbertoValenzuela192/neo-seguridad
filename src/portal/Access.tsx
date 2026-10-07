import { useState } from 'react';
import { NavLink } from 'react-router';
import { Plus } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Empty,
  Field,
  Form,
  Modal,
  PageHeader,
  Panel,
  text,
} from '../components/ui';
import { request } from '../lib/api';
import { nowLabel, SECTIONS } from '../lib/domain';
import type { Role, User } from '../types';
import { useStore } from './store';

export default function Access({ roles = false }: { roles?: boolean }) {
  const { data, session, save, refresh, loading } = useStore(),
    [editUser, setEditUser] = useState<User | null | undefined>(),
    [editRole, setEditRole] = useState<Role | null>(null),
    [remove, setRemove] = useState<{
      kind: 'user' | 'role';
      id: string | number;
      name: string;
    } | null>(null);
  const available = data.neo_roles.filter(
    (r) => r.id === 'cliente' || r.sections.every((s) => session?.sections.includes(s)),
  );
  return (
    <>
      <PageHeader
        title="Usuarios y roles"
        onRefresh={refresh}
        refreshing={loading}
        description={
          roles
            ? 'Define el acceso a cada sección del portal.'
            : 'Las contraseñas se protegen en el servidor y nunca se muestran.'
        }
        actions={
          <Button
            onClick={() =>
              roles
                ? setEditRole({
                    id: 'role_' + crypto.randomUUID(),
                    name: '',
                    sections: [],
                    portal: false,
                  })
                : setEditUser(null)
            }
          >
            <Plus size={17} />
            {roles ? 'Crear rol' : 'Crear usuario'}
          </Button>
        }
      />
      <nav className="page-tabs" aria-label="Administración de accesos">
        {session?.sections.includes('usuarios') && (
          <NavLink to="/usuarios" end>
            Usuarios
          </NavLink>
        )}
        {session?.sections.includes('roles') && (
          <NavLink to="/roles" end>
            Roles y permisos
          </NavLink>
        )}
      </nav>
      {roles ? (
        <div className="record-list">
          {data.neo_roles.map((role) => (
            <Panel key={role.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base">{role.name}</h2>
                  <p className="mt-2 text-xs text-muted">
                    {role.id === 'admin'
                      ? 'Acceso total'
                      : `${role.sections.length} secciones${role.portal ? ' · Portal cliente' : ''}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    disabled={role.id === 'admin'}
                    onClick={() => setEditRole(structuredClone(role))}
                  >
                    Editar permisos
                  </Button>
                  {!['admin', 'cliente'].includes(role.id) && (
                    <Button
                      variant="ghost"
                      onClick={() => setRemove({ kind: 'role', id: role.id, name: role.name })}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : data.neo_usuarios.length ? (
        <div className="record-list">
          {data.neo_usuarios.map((user) => (
            <Panel key={user.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base">{user.nombre || user.usuario}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {user.usuario} ·{' '}
                    {data.neo_roles.find((r) => r.id === user.rol)?.name || user.rol}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={user.activo === false ? 'neutral' : 'success'}>
                    {user.activo === false ? 'Inactivo' : 'Activo'}
                  </Badge>
                  <Button variant="secondary" onClick={() => setEditUser(user)}>
                    Editar
                  </Button>
                  {String(user.id) !== session?.id && user.usuario !== 'admin' && (
                    <Button
                      variant="ghost"
                      onClick={() => setRemove({ kind: 'user', id: user.id, name: user.usuario })}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Empty>No hay usuarios registrados.</Empty>
      )}
      {editUser !== undefined && (
        <Modal
          title={editUser ? 'Editar usuario' : 'Crear usuario'}
          onClose={() => setEditUser(undefined)}
        >
          <Form
            cancel={() => setEditUser(undefined)}
            onSave={async (form) => {
              const username = text(form, 'usuario'),
                password = String(new FormData(form).get('password') || '');
              if (data.neo_usuarios.some((u) => u.usuario === username && u.id !== editUser?.id))
                throw new Error('Ese usuario ya existe.');
              const user: User = {
                ...(editUser || { id: crypto.randomUUID(), createdAt: nowLabel() }),
                usuario: username,
                nombre: text(form, 'nombre'),
                rol: text(form, 'rol'),
                activo:
                  String(editUser?.id) === session?.id
                    ? editUser?.activo !== false
                    : text(form, 'activo') === 'si',
              };
              if (password)
                user.password = (
                  await request<{ hash: string }>('/password-hash', 'POST', { password })
                ).hash;
              await save(
                'neo_usuarios',
                editUser
                  ? data.neo_usuarios.map((u) => (u.id === editUser.id ? user : u))
                  : [...data.neo_usuarios, user],
              );
              setEditUser(undefined);
            }}
          >
            <Field label="Nombre">
              <input name="nombre" defaultValue={editUser?.nombre || ''} required />
            </Field>
            <Field label="Usuario">
              <input
                name="usuario"
                defaultValue={editUser?.usuario || ''}
                required
                autoComplete="off"
              />
            </Field>
            <Field label={editUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
              <input
                name="password"
                type="password"
                minLength={8}
                maxLength={256}
                autoComplete="new-password"
                required={!editUser}
              />
            </Field>
            <Field label="Rol">
              <select name="rol" defaultValue={editUser?.rol || available[0]?.id}>
                {available.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select
                name="activo"
                defaultValue={editUser?.activo === false ? 'no' : 'si'}
                disabled={String(editUser?.id) === session?.id}
              >
                <option value="si">Activo</option>
                <option value="no">Inactivo</option>
              </select>
            </Field>
          </Form>
        </Modal>
      )}
      {editRole && (
        <Modal title={editRole.name ? 'Editar rol' : 'Crear rol'} onClose={() => setEditRole(null)}>
          <Form
            cancel={() => setEditRole(null)}
            onSave={async () => {
              if (!editRole.name.trim()) throw new Error('Escribe un nombre para el rol.');
              const exists = data.neo_roles.some((r) => r.id === editRole.id);
              await save(
                'neo_roles',
                exists
                  ? data.neo_roles.map((r) => (r.id === editRole.id ? editRole : r))
                  : [...data.neo_roles, editRole],
              );
              setEditRole(null);
            }}
          >
            <Field label="Nombre del rol">
              <input
                required
                value={editRole.name}
                onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <label className="flex min-h-11 items-center gap-3 text-sm" key={s.key}>
                  <input
                    type="checkbox"
                    checked={editRole.sections.includes(s.key)}
                    disabled={!session?.sections.includes(s.key)}
                    onChange={(e) =>
                      setEditRole({
                        ...editRole,
                        sections: e.target.checked
                          ? [...editRole.sections, s.key]
                          : editRole.sections.filter((k) => k !== s.key),
                      })
                    }
                  />
                  {s.label}
                </label>
              ))}
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={editRole.portal}
                  onChange={(e) => setEditRole({ ...editRole, portal: e.target.checked })}
                />
                Portal cliente
              </label>
            </div>
          </Form>
        </Modal>
      )}
      {remove && (
        <ConfirmDialog
          title={remove.kind === 'role' ? 'Eliminar rol' : 'Eliminar usuario'}
          description={`¿Eliminar ${remove.name}?`}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            if (remove.kind === 'role') {
              if (
                data.neo_usuarios.some((u) => u.rol === remove.id) ||
                data.neo_cuentas_cliente.some((a) => a.role === remove.id)
              )
                throw new Error(
                  'El rol está asignado a una cuenta. Reasigna sus accesos antes de eliminarlo.',
                );
              await save(
                'neo_roles',
                data.neo_roles.filter((r) => r.id !== remove.id),
              );
            } else
              await save(
                'neo_usuarios',
                data.neo_usuarios.filter((u) => u.id !== remove.id),
              );
          }}
        />
      )}
    </>
  );
}
