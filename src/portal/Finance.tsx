import { useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button, Field, Form, Notice, PageHeader, Panel } from '../components/ui';
import { errorMessage } from '../lib/api';
import { clp, number, parseRange } from '../lib/domain';
import type { Tier } from '../types';
import { useStore } from './store';

export default function Finance({ monthly = false }: { monthly?: boolean }) {
  return monthly ? <Monthly /> : <Prices />;
}
function Prices() {
  const { data, save } = useStore();
  const [prices, setPrices] = useState(structuredClone(data.neo_precios)),
    [impl, setImpl] = useState(structuredClone(data.neo_implementacion)),
    [ufValue, setUF] = useState(String(data.neo_uf)),
    [notice, setNotice] = useState(''),
    [error, setError] = useState(''),
    [refreshing, setRefreshing] = useState(false);
  const [cameras, setCameras] = useState('0'),
    [cost, setCost] = useState('0'),
    [margin, setMargin] = useState('30'),
    [expenses, setExpenses] = useState([{ concept: 'Instalación', amount: '' }]);
  const costCameras = number(cameras) * number(cost),
    additional = expenses.reduce((sum, e) => sum + number(e.amount), 0),
    total = costCameras + additional,
    suggested = Math.round(total * (1 + number(margin) / 100)),
    perCamera = number(cameras) > 0 ? Math.round(suggested / number(cameras)) : 0;
  return (
    <>
      <PageHeader
        title="Precios por cámaras"
        description="Calcula costos y mantén los tramos de monitoreo e implementación."
      />
      <div className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Panel title="Calculadora de precios">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cantidad de cámaras">
              <input
                type="number"
                min="0"
                step="1"
                value={cameras}
                onChange={(e) => setCameras(e.target.value)}
              />
            </Field>
            <Field label="Costo por cámara (CLP)">
              <input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field>
            <Field label="Recargo sobre costo (%)">
              <input
                type="number"
                min="0"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
              />
            </Field>
          </div>
          <h3 className="mb-3 mt-6 text-sm">Gastos adicionales</h3>
          <div className="space-y-3">
            {expenses.map((expense, i) => (
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2" key={i}>
                <Field label={`Concepto ${i + 1}`}>
                  <input
                    value={expense.concept}
                    onChange={(e) =>
                      setExpenses(
                        expenses.map((x, j) => (j === i ? { ...x, concept: e.target.value } : x)),
                      )
                    }
                  />
                </Field>
                <Field label="Monto (CLP)">
                  <input
                    type="number"
                    min="0"
                    value={expense.amount}
                    onChange={(e) =>
                      setExpenses(
                        expenses.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)),
                      )
                    }
                  />
                </Field>
                <Button
                  variant="ghost"
                  aria-label={`Quitar gasto ${i + 1}`}
                  onClick={() => setExpenses(expenses.filter((_, j) => i !== j))}
                >
                  <Trash2 size={17} />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setExpenses([...expenses, { concept: '', amount: '' }])}
          >
            <Plus size={17} />
            Agregar gasto
          </Button>
        </Panel>
        <Panel title="Precio sugerido">
          <Result
            rows={[
              ['Costo cámaras', clp(costCameras)],
              ['Gastos adicionales', clp(additional)],
              ['Costo total', clp(total)],
              ['Precio sugerido', clp(suggested)],
              ['Precio por cámara', clp(perCamera)],
            ]}
          />
          <Button
            className="mt-5"
            disabled={number(cameras) <= 0 || number(ufValue) <= 0}
            onClick={() => {
              setPrices([
                ...prices,
                {
                  qty: `${number(cameras)} cámaras`,
                  price: (perCamera / number(ufValue)).toFixed(2).replace('.', ','),
                },
              ]);
              setNotice(
                'Precio por cámara agregado al borrador. Guarda la tabla para confirmarlo.',
              );
            }}
          >
            Usar en la tabla de precios
          </Button>
        </Panel>
      </div>
      <Panel title="Valor UF" className="mb-6">
        <Form
          label="Guardar valor UF"
          onSave={async () => {
            if (number(ufValue) <= 0) throw new Error('Ingresa un valor UF mayor que cero.');
            await save('neo_uf', number(ufValue));
          }}
        >
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Valor UF (CLP)">
              <input
                type="number"
                min="1"
                value={ufValue}
                onChange={(e) => setUF(e.target.value)}
              />
            </Field>
            <Button
              variant="secondary"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                setError('');
                try {
                  const response = await fetch('https://mindicador.cl/api/uf');
                  const d = await response.json();
                  if (!response.ok || !d.serie?.[0]?.valor)
                    throw new Error('No se pudo obtener la UF. Puedes ingresarla manualmente.');
                  setUF(String(Math.round(d.serie[0].valor)));
                  setNotice('UF consultada. Guarda el valor para confirmarlo.');
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              <RefreshCw size={17} />
              {refreshing ? 'Consultando…' : 'Consultar UF actual'}
            </Button>
          </div>
        </Form>
      </Panel>
      {notice && <Notice>{notice}</Notice>}
      {error && <Notice error>{error}</Notice>}
      <div className="grid gap-6 xl:grid-cols-2">
        <TierEditor
          title="Precio mensual por cámara (UF)"
          rows={prices}
          onChange={setPrices}
          onSave={() => save('neo_precios', prices)}
        />
        <TierEditor
          title="Implementación única (UF)"
          rows={impl}
          onChange={setImpl}
          onSave={() => save('neo_implementacion', impl)}
        />
      </div>
    </>
  );
}
function TierEditor({
  title,
  rows,
  onChange,
  onSave,
}: {
  title: string;
  rows: Tier[];
  onChange: (value: Tier[]) => void;
  onSave: () => Promise<void>;
}) {
  return (
    <Panel title={title}>
      <Form
        onSave={async () => {
          for (const row of rows) {
            if (!parseRange(row.qty) || number(row.price) < 0)
              throw new Error('Revisa los tramos y sus precios.');
          }
          await onSave();
        }}
      >
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div className="grid grid-cols-[1.5fr_1fr_auto] items-end gap-2" key={i}>
              <Field label={`Tramo ${i + 1}`}>
                <input
                  value={row.qty}
                  required
                  placeholder="1 a 10"
                  onChange={(e) =>
                    onChange(rows.map((r, j) => (j === i ? { ...r, qty: e.target.value } : r)))
                  }
                />
              </Field>
              <Field label="Precio (UF)">
                <input
                  value={row.price}
                  inputMode="decimal"
                  placeholder="0,00"
                  onChange={(e) =>
                    onChange(rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))
                  }
                />
              </Field>
              <Button
                variant="ghost"
                aria-label={`Eliminar tramo ${i + 1}`}
                onClick={() => onChange(rows.filter((_, j) => i !== j))}
              >
                <Trash2 size={17} />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="secondary" onClick={() => onChange([...rows, { qty: '', price: '' }])}>
          <Plus size={17} />
          Agregar tramo
        </Button>
      </Form>
    </Panel>
  );
}
function Monthly() {
  const [values, setValues] = useState({
    operators: '1',
    salary: '0',
    cameras: '0',
    integration: '0',
    other: '0',
    iva: '19',
  });
  const salaries = number(values.operators) * number(values.salary),
    integration = number(values.cameras) * number(values.integration),
    subtotal = salaries + integration + number(values.other),
    tax = Math.round((subtotal * number(values.iva)) / 100),
    total = subtotal + tax;
  const fields = [
    ['operators', 'Cantidad de operadores'],
    ['salary', 'Sueldo por operador (CLP)'],
    ['cameras', 'Cantidad de cámaras'],
    ['integration', 'Integración por cámara (CLP)'],
    ['other', 'Otros gastos mensuales (CLP)'],
    ['iva', 'IVA (%)'],
  ] as const;
  return (
    <>
      <PageHeader
        title="Cálculo mensual"
        description="Estima sueldos, integración e IVA de la operación."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Datos mensuales">
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <Field label={label} key={key}>
                <input
                  type="number"
                  min="0"
                  value={values[key]}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
        </Panel>
        <Panel title="Resultado mensual">
          <Result
            rows={[
              ['Sueldos', clp(salaries)],
              ['Integración plataforma', clp(integration)],
              ['Otros gastos', clp(number(values.other))],
              ['Subtotal', clp(subtotal)],
              ['IVA', clp(tax)],
              ['Total mensual', clp(total)],
              ['Descuento primeros 2 meses (30%)', clp(Math.round(total * 0.3))],
              ['Primeros 2 meses (70%)', clp(Math.round(total * 0.7))],
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
export function Result({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([label, value], i) => (
        <div
          key={label}
          className={`flex justify-between gap-4 py-3 text-sm ${i === rows.length - 1 ? 'font-semibold text-bright' : ''}`}
        >
          <dt className={i === rows.length - 1 ? '' : 'text-muted'}>{label}</dt>
          <dd className="shrink-0 tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
