import { useState } from 'react';
import { Mail, Printer } from 'lucide-react';
import {
  Badge,
  Button,
  Empty,
  Field,
  Form,
  Modal,
  Notice,
  PageHeading,
  Panel,
  Values,
} from '../components/ui';
import { findTier, number, STATUS, uf } from '../lib/domain';
import type { Lead, ServiceRequest, Status } from '../types';
import { useStore } from './store';
import { asset } from '../components/Brand';
import { errorMessage } from '../lib/api';

export default function Commercial({ requests = false }: { requests?: boolean }) {
  const { data, save, saving } = useStore(),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [selected, setSelected] = useState<Lead | ServiceRequest | null>(null),
    [quote, setQuote] = useState<{ lead: Lead; implementation: boolean } | null>(null);
  const [actionError, setActionError] = useState('');
  const all = requests ? data.neo_solicitudes_cliente : data.neo_solicitudes;
  const items = all
    .filter(
      (item) =>
        (filter === 'all' || (item.status || 'nuevo') === filter) &&
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase()),
    )
    .slice()
    .reverse();
  return (
    <>
      <PageHeading
        title={requests ? 'Solicitudes de clientes' : 'Clientes potenciales'}
        description={
          requests
            ? 'Gestiona solicitudes de grabación y aumento de cámaras.'
            : 'Desde la primera evaluación hasta la creación de la cuenta.'
        }
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <Field label="Buscar">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, correo o RUT"
          />
        </Field>
        <div className="filters">
          {[['all', 'Todos'], ...Object.entries(STATUS)].map(([value, label]) => (
            <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Panel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base">{'company' in item ? item.company : item.client}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {'company' in item
                      ? `${item.rut} · ${item.solution}`
                      : `${item.typeLabel} · ${item.date}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    tone={
                      item.status === 'atendido'
                        ? 'success'
                        : item.status === 'proceso'
                          ? 'info'
                          : 'warning'
                    }
                  >
                    {STATUS[item.status || 'nuevo']}
                  </Badge>
                  <Button variant="secondary" onClick={() => setSelected(item)}>
                    Ver solicitud
                  </Button>
                </div>
              </div>
              {'company' in item && (
                <p className="mt-4 text-sm text-muted">
                  {item.manager} · {item.email} · {item.cameras} cámaras
                </p>
              )}
            </Panel>
          ))}
        </div>
      ) : (
        <Empty>No hay solicitudes que coincidan con este filtro.</Empty>
      )}
      {selected && (
        <Modal
          title={'company' in selected ? selected.company : selected.client}
          onClose={() => setSelected(null)}
        >
          <Values
            rows={
              'company' in selected
                ? [
                    ['RUT', selected.rut],
                    ['Fecha', selected.date],
                    ['Contacto', selected.manager],
                    ['Correo', selected.email],
                    ['Teléfono', selected.phone],
                    ['Cámaras', selected.cameras],
                    ['Operadores', selected.operators || '—'],
                    ['Solución', selected.solution],
                  ]
                : [
                    ['Tipo', selected.typeLabel],
                    ['Fecha', selected.date],
                    ['Desde', selected.from || selected.eventAt || '—'],
                    ['Hasta', selected.to || '—'],
                    ['Cámaras', selected.cameras || '—'],
                    ['Descripción', selected.message],
                  ]
            }
          />
          <div className="mt-6">
            <Form
              label="Actualizar estado"
              onSave={async () => {
                if (requests)
                  await save(
                    'neo_solicitudes_cliente',
                    data.neo_solicitudes_cliente.map((i) =>
                      i.id === selected.id ? { ...i, status: selected.status } : i,
                    ),
                  );
                else
                  await save(
                    'neo_solicitudes',
                    data.neo_solicitudes.map((i) =>
                      i.id === selected.id ? { ...i, status: selected.status } : i,
                    ),
                  );
                setSelected(null);
              }}
            >
              <Field label="Estado de atención">
                <select
                  value={selected.status || 'nuevo'}
                  onChange={(e) => setSelected({ ...selected, status: e.target.value as Status })}
                >
                  {Object.entries(STATUS).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </Form>
          </div>
          {'company' in selected && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
              <Button
                variant="secondary"
                onClick={() => setQuote({ lead: selected, implementation: false })}
              >
                Cotización
              </Button>
              <Button
                variant="secondary"
                onClick={() => setQuote({ lead: selected, implementation: true })}
              >
                PDF implementación
              </Button>
              <Button
                variant="ghost"
                disabled={saving}
                onClick={async () => {
                  setActionError('');
                  try {
                    const next = { ...selected, implPaid: !selected.implPaid };
                    await save(
                      'neo_solicitudes',
                      data.neo_solicitudes.map((l) => (l.id === next.id ? next : l)),
                    );
                    setSelected(next);
                  } catch (e) {
                    setActionError(errorMessage(e));
                  }
                }}
              >
                {selected.implPaid
                  ? 'Marcar implementación pendiente'
                  : 'Marcar implementación pagada'}
              </Button>
            </div>
          )}
          {actionError && <Notice error>{actionError}</Notice>}
        </Modal>
      )}
      {quote && (
        <Quote
          lead={quote.lead}
          implementation={quote.implementation}
          onClose={() => setQuote(null)}
        />
      )}
    </>
  );
}
function Quote({
  lead,
  implementation,
  onClose,
}: {
  lead: Lead;
  implementation: boolean;
  onClose: () => void;
}) {
  const { data } = useStore(),
    cameras = number(lead.cameras),
    tier = findTier(implementation ? data.neo_implementacion : data.neo_precios, cameras);
  const [price, setPrice] = useState(String(number(tier?.price))),
    [iva, setIVA] = useState('19');
  const net = number(price) * cameras,
    tax = (net * number(iva)) / 100,
    total = net + tax;
  const rows: [string, string][] = implementation
    ? [
        ['Cantidad de cámaras', String(cameras)],
        ['Tramo', tier?.qty || 'Sin tramo'],
        ['Estado', lead.implPaid ? 'Pagada' : 'Pendiente'],
        ['Implementación única', uf(number(tier?.price))],
      ]
    : [
        ['Cantidad de cámaras', String(cameras)],
        ['Precio neto por cámara', uf(number(price))],
        ['Neto', uf(net)],
        ['IVA', uf(tax)],
        ['Total de la factura', uf(total)],
        ['Descuento primeros 2 meses (30%)', uf(total * 0.3)],
        ['Total primeros 2 meses (70%)', uf(total * 0.7)],
      ];
  return (
    <Modal title={implementation ? 'Implementación' : 'Cotización'} onClose={onClose}>
      <div className="quote-document document-print">
        <div className="mb-5 flex items-center gap-4">
          <img src={asset('neo-globo-icon.png')} width="54" height="54" alt="" />
          <div>
            <h3>{implementation ? 'Implementación' : 'Cotización'}</h3>
            <p className="text-sm">NEO Seguridad · {lead.date}</p>
          </div>
        </div>
        <Values
          rows={[
            ['Empresa', lead.company],
            ['RUT', lead.rut],
            ['Contacto', lead.manager],
            ['Correo', lead.email],
            ['Teléfono', lead.phone],
            ['Solución', lead.solution],
          ]}
        />
        {!implementation && (
          <div className="my-5 grid grid-cols-2 gap-4">
            <Field label="Precio neto por cámara (UF)">
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field label="IVA (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={iva}
                onChange={(e) => setIVA(e.target.value)}
              />
            </Field>
          </div>
        )}
        <table className="data-table mt-5">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dialog-actions">
        <a
          className="button button-secondary"
          href={`mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent('Cotización ' + lead.company)}&body=${encodeURIComponent([lead.company, lead.rut, ...rows.map((r) => r.join(': '))].join('\n'))}`}
        >
          <Mail size={17} />
          Enviar por correo
        </a>
        <Button onClick={() => window.print()}>
          <Printer size={17} />
          Imprimir / Guardar PDF
        </Button>
      </div>
    </Modal>
  );
}
