import { useState } from 'react';
import { Badge, Button, Field, Form, Notice, PageHeader, Panel, Values } from '../components/ui';
import { InstallationFields } from '../components/InstallationFields';
import { installationReady, installations, newInstallation, nowLabel, STATUS } from '../lib/domain';
import type { Installation, ServiceRequest } from '../types';
import { useStore } from './store';

export default function Client() {
  const { data, session, save } = useStore();
  const account = data.neo_cuentas_cliente.find((a) => String(a.id) === session?.id),
    list = account ? installations(account) : [];
  const pending = list.find((i) => !installationReady(i));
  const [tab, setTab] = useState('grabacion'),
    [edit, setEdit] = useState<Installation | null>(null),
    [selected, setSelected] = useState(String(list[0]?.id || ''));
  const ownRequests = data.neo_solicitudes_cliente.filter(
    (r) => !r.accountId || r.accountId === session?.id,
  );
  if (!account)
    return <Notice error>No se pudo cargar tu cuenta. Actualiza la página para reintentar.</Notice>;
  const target = edit || pending;
  async function saveInstallation(value: Installation) {
    if (!account) return;
    const normalized = { ...value, onboarded: true };
    if (!installationReady(normalized))
      throw new Error(
        'Completa el nombre, una dirección, el orden de llamado y los datos de guardias y supervisor cuando corresponda.',
      );
    if (normalized.addresses.some((a) => !a.address.trim() || a.lat === null || a.lng === null))
      throw new Error('Ubica cada dirección en el mapa o ingresa sus coordenadas.');
    const next = list.some((i) => String(i.id) === String(value.id))
      ? list.map((i) => (String(i.id) === String(value.id) ? normalized : i))
      : [...list, normalized];
    await save(
      'neo_cuentas_cliente',
      data.neo_cuentas_cliente.map((a) =>
        a.id === account.id ? { ...a, installations: next } : a,
      ),
    );
    setEdit(null);
  }
  if (target)
    return (
      <>
        <PageHeader
          title={pending ? 'Completa los datos de tu instalación' : 'Datos de la instalación'}
          description="Los datos de contacto y ubicación quedan compartidos con NEO."
        />
        <Panel>
          <InstallationForm
            key={target.id}
            initial={target}
            onSave={saveInstallation}
            onCancel={pending ? undefined : () => setEdit(null)}
            readOnlyLocation={
              !pending &&
              !!target.onboarded &&
              target.addresses.every((a) => a.lat !== null && a.lng !== null)
            }
          />
        </Panel>
      </>
    );
  return (
    <>
      <PageHeader
        title="Solicitudes de servicio"
        description={`Bienvenido, ${account.name || account.user}.`}
      />
      <div className="filters mb-6">
        {[
          ['grabacion', 'Solicitar grabación'],
          ['camaras', 'Aumento de cámaras'],
          ['datos', 'Datos de la instalación'],
        ].map(([value, label]) => (
          <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'datos' ? (
        <Panel>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <Field label="Instalación">
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                {list.map((i) => (
                  <option key={i.id} value={String(i.id)}>
                    {i.code ? i.code + ' · ' : ''}
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button variant="secondary" onClick={() => setEdit(newInstallation())}>
              Agregar otra instalación
            </Button>
          </div>
          {list
            .filter((i) => String(i.id) === selected)
            .map((i) => (
              <div key={i.id}>
                <Values
                  rows={[
                    ['Nombre', i.name],
                    ['Dirección', i.addresses[0]?.address],
                    ['Contactos', i.callOrder.length],
                    ['Guardias', i.guards.length],
                  ]}
                />
                <Button className="mt-6" onClick={() => setEdit(structuredClone(i))}>
                  Actualizar contactos
                </Button>
              </div>
            ))}
        </Panel>
      ) : (
        <Panel>
          <Form
            key={tab}
            label="Enviar solicitud"
            onSave={async (form) => {
              const fields = Object.fromEntries(new FormData(form).entries()),
                from = `${fields.fromDate || ''} ${fields.fromTime || ''}`.trim(),
                to = `${fields.toDate || ''} ${fields.toTime || ''}`.trim();
              if (
                tab === 'grabacion' &&
                new Date(from.replace(' ', 'T')) >= new Date(to.replace(' ', 'T'))
              )
                throw new Error('La fecha de término debe ser posterior al inicio.');
              const item: ServiceRequest = {
                id: crypto.randomUUID(),
                date: nowLabel(),
                client: account.name || account.user,
                accountId: session!.id,
                type: tab,
                typeLabel: tab === 'grabacion' ? 'Grabación' : 'Aumento de cámaras',
                message: String(fields.message || ''),
                status: 'nuevo',
                ...(tab === 'grabacion' ? { from, to } : { cameras: String(fields.cameras || '') }),
              };
              await save('neo_solicitudes_cliente', [...data.neo_solicitudes_cliente, item]);
              form.reset();
            }}
          >
            {tab === 'grabacion' ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Desde · fecha">
                  <input type="date" name="fromDate" required />
                </Field>
                <Field label="Desde · hora">
                  <input type="time" name="fromTime" required />
                </Field>
                <Field label="Hasta · fecha">
                  <input type="date" name="toDate" required />
                </Field>
                <Field label="Hasta · hora">
                  <input type="time" name="toTime" required />
                </Field>
              </div>
            ) : (
              <Field label="Cantidad de cámaras a agregar">
                <input type="number" name="cameras" min="1" step="1" required />
              </Field>
            )}
            <Field label={tab === 'grabacion' ? 'Descripción del evento' : 'Descripción / motivo'}>
              <textarea name="message" rows={4} required />
            </Field>
          </Form>
        </Panel>
      )}
      {ownRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg">Tus solicitudes</h2>
          <div className="space-y-3">
            {ownRequests
              .slice()
              .reverse()
              .map((r) => (
                <Panel key={r.id}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm">
                      {r.typeLabel} · {r.date}
                    </h3>
                    <Badge tone={r.status === 'atendido' ? 'success' : 'warning'}>
                      {STATUS[r.status || 'nuevo']}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">{r.message}</p>
                </Panel>
              ))}
          </div>
        </section>
      )}
    </>
  );
}
function InstallationForm({
  initial,
  onSave,
  onCancel,
  readOnlyLocation = false,
}: {
  initial: Installation;
  onSave: (value: Installation) => Promise<void>;
  onCancel?: () => void;
  readOnlyLocation?: boolean;
}) {
  const [value, setValue] = useState(structuredClone(initial));
  return (
    <Form onSave={() => onSave(value)} cancel={onCancel}>
      <InstallationFields value={value} onChange={setValue} readOnlyLocation={readOnlyLocation} />
      <Notice>Completa los datos para habilitar el monitoreo de la instalación.</Notice>
    </Form>
  );
}
