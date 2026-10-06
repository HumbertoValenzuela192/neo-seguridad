import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Settings } from 'lucide-react';
import {
  Badge,
  Button,
  Confirm,
  Empty,
  Field,
  Form,
  Loading,
  Modal,
  Notice,
  PageHeading,
  Panel,
  text,
} from '../components/ui';
import { InstallationFields } from '../components/InstallationFields';
import { errorMessage, request } from '../lib/api';
import { newInstallation } from '../lib/domain';
import type { DirectoryClient, DirectoryContact, Installation, Organization } from '../types';
import { useStore } from './store';

function toInstallation(c: DirectoryClient): Installation {
  return {
    ...newInstallation(),
    id: c.id,
    name: c.name,
    hasGuard: c.has_guard ? 'si' : 'no',
    addresses: c.addresses.length
      ? c.addresses.map((a) => ({ address: a.address, lat: a.latitude, lng: a.longitude }))
      : [{ address: c.address, lat: c.latitude, lng: c.longitude }],
    callOrder: c.contacts.map((p) => ({
      name: p.name,
      phone: p.phone,
      cargo: p.relationship,
      email: p.email,
    })),
    guards: c.guards.map((p) => ({
      name: p.name,
      phone: p.phone,
      cargo: p.relationship,
      email: p.email,
    })),
    supervisorName: c.supervisor.name,
    supervisorPhone: c.supervisor.phone,
    supervisorCargo: c.supervisor.relationship,
    supervisorEmail: c.supervisor.email,
    onboarded: c.status === 'ready',
  };
}
export default function Directory() {
  const { refresh } = useStore();
  const [clients, setClients] = useState<DirectoryClient[]>([]),
    [organizations, setOrganizations] = useState<Organization[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [edit, setEdit] = useState<DirectoryClient | null | undefined>(),
    [manage, setManage] = useState(false);
  async function load() {
    setLoading(true);
    setError('');
    try {
      const [a, b] = await Promise.all([
        request<{ clients: DirectoryClient[] }>('/directory/clients'),
        request<{ organizations: Organization[] }>('/directory/organizations'),
      ]);
      setClients(a.clients);
      setOrganizations(b.organizations);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const filtered = clients.filter(
    (c) =>
      (filter === 'all' ||
        (filter === 'none' ? !c.organization_id : c.organization_id === filter)) &&
      `${c.name} ${c.code} ${c.address}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Clientes compartidos con NEO"
        description="Fichas operativas y organizaciones. Los accesos del portal se administran por separado."
        actions={
          <>
            <Button variant="secondary" onClick={() => setManage(true)}>
              <Settings size={17} />
              Organizaciones
            </Button>
            <Button onClick={() => setEdit(null)}>
              <Plus size={17} />
              Nuevo cliente
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar cliente" className="min-w-48 flex-1">
          <input
            type="search"
            placeholder="Código, nombre o dirección"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <Field label="Organización">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todas las organizaciones</option>
            <option value="none">Sin organización</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Button variant="secondary" disabled={loading} onClick={() => void load()}>
          <RefreshCw size={17} />
          Actualizar
        </Button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}
      {loading ? (
        <Loading />
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Panel key={c.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base">
                    <span className="mr-2 text-bright">{c.code}</span>
                    {c.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{c.address || 'Dirección pendiente'}</p>
                  <p className="mt-1 text-xs text-muted">
                    {organizations.find((o) => o.id === c.organization_id)?.name ||
                      'Sin organización'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={c.status === 'ready' ? 'success' : 'warning'}>
                    {c.status === 'ready' ? 'Datos completos' : 'Datos pendientes'}
                  </Badge>
                  <Button variant="secondary" onClick={() => setEdit(c)}>
                    Editar ficha
                  </Button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Empty>No hay fichas que coincidan con el filtro.</Empty>
      )}
      <div className="mt-6">
        <Button
          variant="ghost"
          onClick={async () => {
            try {
              const result = await request<{ accounts: number }>('/directory/import', 'POST', {});
              setNotice(`Importación verificada. Cuentas procesadas: ${result.accounts}.`);
              await load();
            } catch (e) {
              setError(errorMessage(e));
            }
          }}
        >
          Verificar importación de cuentas anteriores
        </Button>
      </div>
      {edit !== undefined && (
        <DirectoryEditor
          client={edit}
          organizations={organizations}
          onClose={() => setEdit(undefined)}
          onSaved={async () => {
            setEdit(undefined);
            setNotice('Ficha guardada en NEO.');
            await load();
            await refresh();
          }}
        />
      )}
      {manage && (
        <Organizations
          organizations={organizations}
          onClose={() => setManage(false)}
          onChanged={async () => {
            await load();
            await refresh();
          }}
        />
      )}
    </>
  );
}
function DirectoryEditor({
  client,
  organizations,
  onClose,
  onSaved,
}: {
  client: DirectoryClient | null;
  organizations: Organization[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(() => (client ? toInstallation(client) : newInstallation())),
    [code, setCode] = useState(client?.code || ''),
    [organization, setOrganization] = useState(client?.organization_id || ''),
    [status, setStatus] = useState(client?.status || 'pending');
  const [externalID] = useState(
    () => client?.external_id || 'portal-directory:' + crypto.randomUUID(),
  );
  return (
    <Modal title={client ? `Editar ${client.code}` : 'Nuevo cliente'} onClose={onClose}>
      <Form
        cancel={onClose}
        onSave={async () => {
          const first = value.addresses[0],
            person = (p: {
              name: string;
              phone: string;
              cargo?: string;
              email?: string;
            }): DirectoryContact => ({
              name: p.name,
              phone: p.phone,
              relationship: p.cargo || '',
              email: p.email || '',
            });
          const body = {
            name: value.name.trim(),
            code: code.trim(),
            organization_id: organization || null,
            status,
            address: first?.address || '',
            latitude: first?.lat ?? null,
            longitude: first?.lng ?? null,
            addresses: value.addresses.map((a) => ({
              address: a.address,
              latitude: a.lat,
              longitude: a.lng,
            })),
            contacts: value.callOrder.map(person),
            guards: value.guards.map(person),
            supervisor: person({
              name: value.supervisorName,
              phone: value.supervisorPhone,
              cargo: value.supervisorCargo || 'Supervisor',
              email: value.supervisorEmail,
            }),
            has_guard: value.hasGuard === 'si',
            ...(client ? { version: client.version } : { external_id: externalID }),
          };
          await request(
            '/directory/clients' + (client ? '/' + encodeURIComponent(client.id) : ''),
            client ? 'PATCH' : 'POST',
            body,
          );
          await onSaved();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código" hint="Déjalo vacío para asignarlo automáticamente.">
            <input value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field label="Organización">
            <select value={organization} onChange={(e) => setOrganization(e.target.value)}>
              <option value="">Sin organización</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado de la ficha">
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="pending">Datos pendientes</option>
              <option value="ready">Datos completos</option>
            </select>
          </Field>
        </div>
        <InstallationFields value={value} onChange={setValue} />
      </Form>
    </Modal>
  );
}
function Organizations({
  organizations,
  onClose,
  onChanged,
}: {
  organizations: Organization[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<Organization | null | undefined>(),
    [remove, setRemove] = useState<Organization | null>(null);
  return (
    <Modal title="Organizaciones" onClose={onClose}>
      <div className="space-y-3">
        {organizations.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3"
          >
            <span className="text-sm">{o.name}</span>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => setEdit(o)}>
                Renombrar
              </Button>
              <Button variant="ghost" onClick={() => setRemove(o)}>
                Quitar
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button className="mt-4" variant="secondary" onClick={() => setEdit(null)}>
        <Plus size={17} />
        Crear organización
      </Button>
      {edit !== undefined && (
        <Modal
          title={edit ? 'Renombrar organización' : 'Crear organización'}
          onClose={() => setEdit(undefined)}
        >
          <Form
            cancel={() => setEdit(undefined)}
            onSave={async (form) => {
              await request(
                '/directory/organizations' + (edit ? '/' + edit.id : ''),
                edit ? 'PUT' : 'POST',
                { name: text(form, 'name') },
              );
              setEdit(undefined);
              await onChanged();
            }}
          >
            <Field label="Nombre">
              <input name="name" required defaultValue={edit?.name || ''} />
            </Field>
          </Form>
        </Modal>
      )}
      {remove && (
        <Confirm
          title="Quitar organización"
          description={`Se quitará ${remove.name}. Sus fichas de clientes se conservarán sin esa asociación.`}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await request('/directory/organizations/' + remove.id, 'DELETE');
            await onChanged();
          }}
        />
      )}
    </Modal>
  );
}
