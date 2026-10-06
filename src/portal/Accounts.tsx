import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Confirm,
  Empty,
  Field,
  Form,
  Modal,
  PageHeading,
  Panel,
  text,
} from '../components/ui';
import { request } from '../lib/api';
import { installationReady, installations, nowLabel } from '../lib/domain';
import type { Account, ID } from '../types';
import { useStore } from './store';

interface Source {
  kind: string;
  id: ID;
  name: string;
  email: string;
}
export default function Accounts() {
  const { data, save, session } = useStore(),
    [query, setQuery] = useState(''),
    [editing, setEditing] = useState<{ account: Account | null; source?: Source } | null>(null),
    [remove, setRemove] = useState<Account | null>(null);
  const sources: Source[] = [
    ...data.neo_solicitudes
      .filter((l) => l.status === 'atendido')
      .map((l) => ({ kind: 'lead', id: l.id, name: l.company, email: l.email })),
    ...data.neo_solicitudes_cliente
      .filter((r) => r.status === 'atendido')
      .map((r) => ({ kind: 'req', id: r.id, name: r.client, email: '' })),
  ].filter(
    (s) =>
      !data.neo_cuentas_cliente.some(
        (a) => a.source === s.kind && String(a.sourceId) === String(s.id),
      ),
  );
  const useSections = session?.sections || [];
  const roles = data.neo_roles.filter(
    (r) => r.id === 'cliente' || r.sections.every((s) => useSections.includes(s)),
  );
  const accounts = data.neo_cuentas_cliente.filter((a) =>
    `${a.name} ${a.user}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Cuentas del cliente"
        description="Gestiona accesos y revisa el estado de las instalaciones."
        actions={
          <Button onClick={() => setEditing({ account: null })}>
            <Plus size={17} />
            Crear cuenta
          </Button>
        }
      />
      <Field label="Buscar cuenta" className="mb-6 max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre o usuario"
        />
      </Field>
      {sources.length > 0 && (
        <Panel title="Solicitudes atendidas sin cuenta" className="mb-6">
          <div className="divide-y divide-line">
            {sources.map((s) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                key={s.kind + String(s.id)}
              >
                <span className="text-sm">{s.name}</span>
                <Button
                  variant="secondary"
                  onClick={() => setEditing({ account: null, source: s })}
                >
                  Crear acceso
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {accounts.length ? (
        <div className="space-y-3">
          {accounts.map((a) => {
            const ready = installations(a).some(installationReady);
            return (
              <Panel key={a.id}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base">{a.name || a.user}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {a.user} · {data.neo_roles.find((r) => r.id === a.role)?.name || a.role}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone={ready ? 'success' : 'warning'}>
                      {ready ? 'Datos completos' : 'Datos pendientes'}
                    </Badge>
                    <Button variant="secondary" onClick={() => setEditing({ account: a })}>
                      Editar acceso
                    </Button>
                    <Button variant="ghost" onClick={() => setRemove(a)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {installations(a)
                    .filter((i) => i.name)
                    .map((i) => (
                      <Badge key={i.id}>
                        {i.code ? i.code + ' · ' : ''}
                        {i.name}
                      </Badge>
                    ))}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Empty>No hay cuentas que coincidan con la búsqueda.</Empty>
      )}
      {editing && (
        <Modal
          title={editing.account ? 'Editar acceso' : 'Crear cuenta'}
          onClose={() => setEditing(null)}
        >
          <Form
            cancel={() => setEditing(null)}
            onSave={async (form) => {
              const old = editing.account,
                user = text(form, 'user'),
                password = String(new FormData(form).get('password') || '');
              if (data.neo_cuentas_cliente.some((a) => a.user === user && a.id !== old?.id))
                throw new Error('Ese usuario ya está en uso.');
              const a: Account = {
                ...(old || {
                  id: crypto.randomUUID(),
                  installations: [],
                  createdAt: nowLabel(),
                  source: editing.source?.kind || null,
                  sourceId: editing.source?.id || null,
                }),
                name: text(form, 'name'),
                user,
                role: text(form, 'role'),
                activo: text(form, 'activo') === 'si',
              };
              if (password)
                a.pass = (
                  await request<{ hash: string }>('/password-hash', 'POST', { password })
                ).hash;
              await save(
                'neo_cuentas_cliente',
                old
                  ? data.neo_cuentas_cliente.map((item) => (item.id === old.id ? a : item))
                  : [...data.neo_cuentas_cliente, a],
              );
              setEditing(null);
            }}
          >
            <Field label="Nombre del cliente">
              <input
                name="name"
                defaultValue={editing.account?.name || editing.source?.name || ''}
                required
              />
            </Field>
            <Field label="Usuario">
              <input
                name="user"
                autoComplete="off"
                defaultValue={editing.account?.user || editing.source?.email || ''}
                required
              />
            </Field>
            <Field
              label={editing.account ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              hint="Entre 8 y 256 caracteres. Se protege en el servidor."
            >
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={256}
                required={!editing.account}
              />
            </Field>
            <Field label="Rol">
              <select name="role" defaultValue={editing.account?.role || 'cliente'}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado de acceso">
              <select name="activo" defaultValue={editing.account?.activo === false ? 'no' : 'si'}>
                <option value="si">Activo</option>
                <option value="no">Inactivo</option>
              </select>
            </Field>
          </Form>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="Eliminar cuenta"
          description={`Se eliminará el acceso de ${remove.name || remove.user}. Sus fichas del directorio NEO se conservarán.`}
          onClose={() => setRemove(null)}
          onConfirm={() =>
            save(
              'neo_cuentas_cliente',
              data.neo_cuentas_cliente.filter((a) => a.id !== remove.id),
            )
          }
        />
      )}
    </>
  );
}
