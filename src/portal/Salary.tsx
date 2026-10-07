import { useState } from 'react';
import { Plus, Printer, RefreshCw } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Empty,
  Field,
  Form,
  Modal,
  Notice,
  PageHeader,
  Panel,
  Values,
} from '../components/ui';
import { AFP, clp, computeOperator, DEFAULT_SALARY, number } from '../lib/domain';
import type { Operator } from '../types';
import { useStore } from './store';
import { Result } from './Finance';

const blank = (): Operator => ({
  id: crypto.randomUUID(),
  name: '',
  cargo: '',
  base: '',
  otros: '',
  noImponibles: '',
  diasTrabajados: '30',
  horasAtraso: '',
  horasExtra: '',
  gratificacion: '',
});
export default function Salary() {
  const { data, save, refresh, loading } = useStore(),
    params = data.neo_sueldo_params,
    operators = data.neo_sueldos;
  const [edit, setEdit] = useState<{ index: number; op: Operator } | null>(null),
    [remove, setRemove] = useState<number | null>(null),
    [settings, setSettings] = useState(false),
    [draft, setDraft] = useState({ ...params }),
    [documents, setDocuments] = useState<Operator[] | null>(null),
    [liquid, setLiquid] = useState(''),
    [lookupError, setLookupError] = useState(''),
    [lookupBusy, setLookupBusy] = useState(false);
  const totals = operators.map((op) => computeOperator(op, params));
  const total = (key: 'bruto' | 'descuentos' | 'liquido') =>
    totals.reduce((sum, r) => sum + r[key], 0);
  return (
    <>
      <PageHeader
        onRefresh={refresh}
        refreshing={loading}
        title="Sueldos"
        description="Haberes, descuentos y liquidaciones. Los parámetros actuales se conservan."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft({ ...params });
                setLookupError('');
                setSettings(true);
              }}
            >
              Parámetros
            </Button>
            <Button
              onClick={() => {
                setLiquid('');
                setEdit({ index: -1, op: blank() });
              }}
            >
              <Plus size={17} />
              Agregar operador
            </Button>
          </>
        }
      />
      {operators.length > 0 && (
        <Panel className="mb-6">
          <Values
            rows={[
              ['Operadores', operators.length],
              ['Total bruto', clp(total('bruto'))],
              ['Descuentos', clp(total('descuentos'))],
              ['Total líquido', clp(total('liquido'))],
            ]}
          />
          <Button variant="secondary" className="mt-5" onClick={() => setDocuments(operators)}>
            <Printer size={17} />
            PDF todas las liquidaciones
          </Button>
        </Panel>
      )}
      {operators.length ? (
        <div className="record-list">
          {operators.map((op, i) => {
            const r = totals[i];
            return (
              <Panel key={op.id || i}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base">{op.name || 'Trabajador'}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {op.cargo || 'Sin cargo'} · {AFP[params.afp]?.name} ·{' '}
                      {params.salud === 'isapre' ? 'Isapre' : 'Fonasa'}
                    </p>
                  </div>
                  <Badge tone="success">Líquido {clp(r.liquido)}</Badge>
                </div>
                <div className="mt-5">
                  <Values
                    rows={[
                      ['Sueldo base', clp(number(op.base))],
                      ['Días trabajados', op.diasTrabajados || '30'],
                      ['Imponibles', clp(r.imponibles)],
                      ['Descuentos', clp(r.descuentos)],
                    ]}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setLiquid('');
                      setEdit({ index: i, op: { ...op } });
                    }}
                  >
                    Editar remuneración
                  </Button>
                  <Button variant="secondary" onClick={() => setDocuments([op])}>
                    <Printer size={17} />
                    Liquidación
                  </Button>
                  <Button variant="ghost" onClick={() => setRemove(i)}>
                    Eliminar
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Empty>No hay operadores registrados. Agrega uno para calcular su remuneración.</Empty>
      )}
      {settings && (
        <Modal title="Parámetros de remuneraciones" onClose={() => setSettings(false)}>
          <Form
            cancel={() => setSettings(false)}
            onSave={async () => {
              if (number(draft.jornada) <= 0)
                throw new Error('La jornada debe ser mayor que cero.');
              await save('neo_sueldo_params', draft);
              setSettings(false);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="AFP">
                <select
                  value={draft.afp}
                  onChange={(e) => setDraft({ ...draft, afp: e.target.value })}
                >
                  {Object.entries(AFP).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name} (10% + {value.comision}%)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Salud">
                <select
                  value={draft.salud}
                  onChange={(e) => setDraft({ ...draft, salud: e.target.value })}
                >
                  <option value="fonasa">Fonasa (7%)</option>
                  <option value="isapre">Isapre (plan en UF)</option>
                </select>
              </Field>
              {(
                [
                  ['cesantia', 'Seguro cesantía (%)'],
                  ['jornada', 'Jornada semanal (horas)'],
                  ['uf', 'UF (CLP)'],
                  ['utm', 'UTM (CLP)'],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    inputMode="decimal"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </Field>
              ))}
              {draft.salud === 'isapre' && (
                <Field label="Plan Isapre (UF)">
                  <input
                    inputMode="decimal"
                    value={draft.plan}
                    onChange={(e) => setDraft({ ...draft, plan: e.target.value })}
                  />
                </Field>
              )}
            </div>
            <p className="text-xs text-muted">
              Esta calculadora mantiene las fórmulas existentes. UF y UTM se pueden consultar o
              ingresar manualmente.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={lookupBusy}
                onClick={async () => {
                  setLookupBusy(true);
                  setLookupError('');
                  try {
                    const response = await fetch('https://mindicador.cl/api');
                    const d = await response.json();
                    if (!response.ok || !d.uf?.valor || !d.utm?.valor)
                      throw new Error(
                        'No se pudieron consultar UF/UTM. Ingresa los valores manualmente.',
                      );
                    setDraft({
                      ...draft,
                      uf: String(Math.round(d.uf.valor)),
                      utm: String(Math.round(d.utm.valor)),
                    });
                  } catch (e) {
                    setLookupError(e instanceof Error ? e.message : 'No se pudo consultar.');
                  } finally {
                    setLookupBusy(false);
                  }
                }}
              >
                <RefreshCw size={17} />
                Consultar UF/UTM
              </Button>
              <Button variant="ghost" onClick={() => setDraft({ ...DEFAULT_SALARY })}>
                Restablecer valores
              </Button>
            </div>
            {lookupError && <Notice error>{lookupError}</Notice>}
          </Form>
        </Modal>
      )}
      {edit && (
        <Modal
          title={edit.index < 0 ? 'Agregar operador' : 'Editar remuneración'}
          onClose={() => setEdit(null)}
        >
          <Form
            cancel={() => setEdit(null)}
            onSave={async () => {
              const op = edit.op;
              if (!op.name.trim()) throw new Error('Ingresa el nombre del trabajador.');
              if (number(op.diasTrabajados) > 30 || number(op.diasTrabajados) < 0)
                throw new Error('Los días trabajados deben estar entre 0 y 30.');
              const next = operators.slice();
              if (edit.index < 0) next.push(op);
              else next[edit.index] = op;
              await save('neo_sueldos', next);
              setEdit(null);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['name', 'Nombre'],
                  ['cargo', 'Cargo'],
                  ['base', 'Sueldo base (CLP)'],
                  ['otros', 'Otros imponibles (CLP)'],
                  ['noImponibles', 'No imponibles (CLP)'],
                  ['gratificacion', 'Gratificación (CLP)'],
                  ['diasTrabajados', 'Días trabajados'],
                  ['horasAtraso', 'Atrasos (horas)'],
                  ['horasExtra', 'Horas extras'],
                ] as const
              ).map(([key, label]) => (
                <Field label={label} key={key}>
                  <input
                    required={key === 'name'}
                    inputMode={['name', 'cargo'].includes(key) ? 'text' : 'decimal'}
                    value={edit.op[key] || ''}
                    onChange={(e) =>
                      setEdit({ ...edit, op: { ...edit.op, [key]: e.target.value } })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field
              label="Sueldo líquido objetivo (CLP)"
              hint="Autocompleta sueldo base y gratificación del 25%, como en la calculadora anterior."
            >
              <input
                type="number"
                min="0"
                value={liquid}
                onChange={(e) => {
                  setLiquid(e.target.value);
                  const target = number(e.target.value);
                  let low = 0,
                    high = Math.max(target * 4, 10000000);
                  for (let i = 0; i < 40; i++) {
                    const base = Math.round((low + high) / 2),
                      r = computeOperator(
                        {
                          ...edit.op,
                          base: String(base),
                          gratificacion: String(Math.round(base * 0.25)),
                        },
                        params,
                      );
                    if (r.liquido < target) low = base + 1;
                    else high = base;
                  }
                  const base = Math.round(high);
                  setEdit({
                    ...edit,
                    op: {
                      ...edit.op,
                      base: String(base),
                      gratificacion: String(Math.round(base * 0.25)),
                    },
                  });
                }}
              />
            </Field>
            <Result
              rows={[
                ['Total bruto', clp(computeOperator(edit.op, params).bruto)],
                ['Descuentos legales', clp(computeOperator(edit.op, params).descuentos)],
                ['Sueldo líquido estimado', clp(computeOperator(edit.op, params).liquido)],
              ]}
            />
          </Form>
        </Modal>
      )}
      {remove !== null && (
        <ConfirmDialog
          title="Eliminar operador"
          description={`¿Eliminar a ${operators[remove].name || 'este trabajador'} del cálculo?`}
          onClose={() => setRemove(null)}
          onConfirm={() =>
            save(
              'neo_sueldos',
              operators.filter((_, i) => i !== remove),
            )
          }
        />
      )}
      {documents && (
        <Modal title="Liquidaciones de sueldo" onClose={() => setDocuments(null)}>
          <div className="document-print">
            {documents.map((op, i) => {
              const r = computeOperator(op, params);
              const rows: [string, string][] = [
                ['Sueldo base', clp(number(op.base))],
                ['Sueldo proporcional', clp(r.baseProporcional)],
                ['Otros imponibles', clp(number(op.otros))],
                ['Horas extras', clp(r.pagoHorasExtra)],
                ['Gratificación', clp(r.gratificacion)],
                ['Descuento atrasos', clp(r.descuentoAtraso)],
                ['Haberes imponibles', clp(r.imponibles)],
                ['Haberes no imponibles', clp(r.noImponibles)],
                ['Total bruto', clp(r.bruto)],
                ['Descuento AFP', clp(r.descAfp)],
                ['Descuento salud', clp(r.descSalud)],
                ['Seguro cesantía', clp(r.descCesantia)],
                ['Total descuentos', clp(r.descuentos)],
                ['Sueldo líquido', clp(r.liquido)],
              ];
              return (
                <article key={i} className={i > 0 ? 'print-break mt-8' : ''}>
                  <h3 className="mb-4 text-xl">Liquidación de sueldo · NEO Seguridad</h3>
                  <Values
                    rows={[
                      ['Trabajador', op.name],
                      ['Cargo', op.cargo],
                      ['AFP', AFP[params.afp]?.name],
                      ['Salud', params.salud],
                      ['Jornada', params.jornada],
                      ['Días trabajados', op.diasTrabajados],
                      ['Horas extras', op.horasExtra || '0'],
                      ['Atrasos', op.horasAtraso || '0'],
                    ]}
                  />
                  <table className="data-table mt-5">
                    <tbody>
                      {rows.map(([name, value]) => (
                        <tr key={name}>
                          <th>{name}</th>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              );
            })}
          </div>
          <div className="dialog-actions">
            <Button onClick={() => window.print()}>
              <Printer size={17} />
              Imprimir / Guardar PDF
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
