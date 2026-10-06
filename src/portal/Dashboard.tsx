import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, CalendarDays, Volume2 } from 'lucide-react';
import {
  AddButton,
  Badge,
  Button,
  Empty,
  Field,
  Form,
  Modal,
  Notice,
  PageHeading,
  Panel,
} from '../components/ui';
import { dateKey } from '../lib/domain';
import type { Task } from '../types';
import { useStore } from './store';
import { errorMessage } from '../lib/api';

const SLOTS = [
  ['09:30', '09:30 - 11:00'],
  ['11:00', '11:00 - 12:30'],
  ['12:30', '12:30 - 14:00'],
  ['14:00', '14:00 - 15:30'],
  ['15:30', '15:30 - 17:00'],
  ['17:00', '17:00 - 18:30'],
];
export default function Dashboard() {
  const [actionError, setActionError] = useState('');
  const { data, save, session } = useStore();
  const [now, setNow] = useState(new Date()),
    [date, setDate] = useState(new Date()),
    [view, setView] = useState<'day' | 'week' | 'month'>('day'),
    [editing, setEditing] = useState<{ index: number; task: Task } | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [voice, setVoice] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const update = () =>
      setVoices(speechSynthesis.getVoices().filter((v) => v.lang.startsWith('es')));
    update();
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', update);
      speechSynthesis.cancel();
    };
  }, []);
  const leads = data.neo_solicitudes,
    requests = data.neo_solicitudes_cliente,
    agenda = data.neo_horario;
  const tasks = agenda[dateKey(date)] || [],
    today = agenda[dateKey(now)] || [];
  const summary = `Hoy tienes ${today.filter((t) => t.client || t.text).length} reuniones, ${leads.filter((l) => l.status === 'nuevo').length} clientes potenciales nuevos y ${requests.filter((r) => r.status === 'nuevo').length} solicitudes de clientes pendientes.`;
  const counts = [
    ['Clientes nuevos', leads.filter((l) => l.status === 'nuevo').length, '/solicitudes'],
    ['En proceso', leads.filter((l) => l.status === 'proceso').length, '/solicitudes'],
    ['Solicitudes pendientes', requests.filter((r) => r.status !== 'atendido').length, '/clientes'],
    ['Trabajadores', data.neo_sueldos.length, '/sueldo'],
  ] as const;
  const shift = (direction: number) => {
    const next = new Date(date);
    if (view === 'month') next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + direction * (view === 'week' ? 7 : 1));
    setDate(next);
  };
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return (
    <>
      <PageHeading
        title={`Bienvenido, ${session?.name || 'usuario'}`}
        description={
          now.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }) +
          ' · ' +
          now.toLocaleTimeString('es-CL')
        }
      />
      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {counts.map(([label, n, path]) =>
          session?.sections.includes(path.slice(1) as 'solicitudes') ? (
            <Link key={label} to={path} className="panel transition-colors hover:border-accent">
              <span className="text-xs text-muted">{label}</span>
              <strong className="mt-3 block text-3xl font-semibold tabular-nums">{n}</strong>
            </Link>
          ) : (
            <div key={label} className="panel">
              <span className="text-xs text-muted">{label}</span>
              <strong className="mt-3 block text-3xl font-semibold tabular-nums">{n}</strong>
            </div>
          ),
        )}
      </div>
      <Panel title="Resumen del día" className="mb-6">
        <p className="mb-5 text-sm text-muted">{summary}</p>
        {typeof window !== 'undefined' && 'speechSynthesis' in window && (
          <div className="flex flex-wrap gap-3">
            <Field label="Voz del resumen">
              <select value={voice} onChange={(e) => setVoice(e.target.value)}>
                <option value="">Voz predeterminada</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button
              className="self-end"
              variant="secondary"
              onClick={() => {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(summary);
                utterance.lang = 'es-CL';
                utterance.voice = voices.find((v) => v.voiceURI === voice) || null;
                speechSynthesis.speak(utterance);
              }}
            >
              <Volume2 size={17} />
              Escuchar resumen
            </Button>
          </div>
        )}
      </Panel>
      <Panel>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg">
            <CalendarDays size={20} className="text-accent" />
            Agenda
          </h2>
          <div className="filters">
            {[
              ['day', 'Día'],
              ['week', 'Semana'],
              ['month', 'Mes'],
            ].map(([v, label]) => (
              <button key={v} aria-pressed={view === v} onClick={() => setView(v as typeof view)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="ghost" aria-label="Período anterior" onClick={() => shift(-1)}>
            <ArrowLeft size={18} />
          </Button>
          <div className="text-center text-sm capitalize">
            {date.toLocaleDateString(
              'es-CL',
              view === 'month'
                ? { month: 'long', year: 'numeric' }
                : { weekday: 'long', day: 'numeric', month: 'long' },
            )}
          </div>
          <Button variant="ghost" aria-label="Período siguiente" onClick={() => shift(1)}>
            <ArrowRight size={18} />
          </Button>
        </div>
        {view === 'day' ? (
          <>
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <Field label="Elegir fecha">
                <input
                  type="date"
                  value={dateKey(date)}
                  onChange={(e) => {
                    if (e.target.value) setDate(new Date(e.target.value + 'T12:00:00'));
                  }}
                />
              </Field>
              <AddButton
                onClick={() =>
                  setEditing({
                    index: -1,
                    task: { time: '', client: '', text: '', complexity: '' },
                  })
                }
              >
                Agregar reunión
              </AddButton>
            </div>
            {tasks.length ? (
              <div className="divide-y divide-line">
                {tasks.map((task, i) => (
                  <div className="flex flex-wrap items-center justify-between gap-4 py-4" key={i}>
                    <div>
                      <span className="mr-3 text-sm text-bright">{task.time || 'Sin hora'}</span>
                      <strong className="text-sm">{task.client || 'Sin cliente'}</strong>
                      <p className="mt-1 text-sm text-muted">{task.text}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.complexity && (
                        <Badge tone={task.complexity === 'alta' ? 'warning' : 'neutral'}>
                          Complejidad {task.complexity}
                        </Badge>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => setEditing({ index: i, task: { ...task } })}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>No hay reuniones para esta fecha.</Empty>
            )}
          </>
        ) : view === 'week' ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(monday);
              d.setDate(d.getDate() + i);
              const list = agenda[dateKey(d)] || [];
              return (
                <button
                  key={i}
                  className="agenda-day rounded-xl border border-line p-4 text-left hover:bg-raised"
                  onClick={() => {
                    setDate(d);
                    setView('day');
                  }}
                >
                  <strong className="text-sm capitalize">
                    {d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })}
                  </strong>
                  {list.length ? (
                    list.map((t, i) => (
                      <span key={i} className="text-xs text-muted">
                        {t.time} · {t.client || t.text}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted">Sin reuniones</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <span key={day} className="py-2 text-center text-xs text-muted">
                {day}
              </span>
            ))}
            {Array.from(
              { length: (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7 },
              (_, i) => (
                <span key={'empty' + i} />
              ),
            )}
            {Array.from(
              { length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() },
              (_, i) => {
                const d = new Date(date.getFullYear(), date.getMonth(), i + 1),
                  n = (agenda[dateKey(d)] || []).filter((t) => t.client || t.text).length;
                return (
                  <button
                    className="calendar-cell hover:border-accent"
                    key={i}
                    aria-label={`${d.toLocaleDateString('es-CL')}, ${n} reuniones`}
                    onClick={() => {
                      setDate(d);
                      setView('day');
                    }}
                  >
                    {i + 1}
                    {n > 0 && <small>{n} citas</small>}
                  </button>
                );
              },
            )}
          </div>
        )}
      </Panel>
      {editing && (
        <Modal
          title={editing.index < 0 ? 'Agregar reunión' : 'Editar reunión'}
          onClose={() => setEditing(null)}
        >
          <Form
            onSave={async () => {
              const next = tasks.slice();
              if (editing.index < 0) next.push(editing.task);
              else next[editing.index] = editing.task;
              await save('neo_horario', { ...agenda, [dateKey(date)]: next });
              setEditing(null);
            }}
            cancel={() => setEditing(null)}
          >
            <Field label="Hora">
              <select
                required
                value={editing.task.time}
                onChange={(e) =>
                  setEditing({ ...editing, task: { ...editing.task, time: e.target.value } })
                }
              >
                <option value="">Selecciona un bloque</option>
                {SLOTS.map(([v, label]) => (
                  <option
                    key={v}
                    value={v}
                    disabled={tasks.some((t, i) => i !== editing.index && t.time === v)}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cliente">
              <input
                required
                list="agenda-clients"
                value={editing.task.client}
                onChange={(e) =>
                  setEditing({ ...editing, task: { ...editing.task, client: e.target.value } })
                }
              />
            </Field>
            <datalist id="agenda-clients">
              {leads.map((l) => (
                <option key={l.id} value={l.company} />
              ))}
            </datalist>
            <Field label="Tema / reunión">
              <input
                value={editing.task.text}
                onChange={(e) =>
                  setEditing({ ...editing, task: { ...editing.task, text: e.target.value } })
                }
              />
            </Field>
            <Field label="Complejidad">
              <select
                value={editing.task.complexity}
                onChange={(e) =>
                  setEditing({ ...editing, task: { ...editing.task, complexity: e.target.value } })
                }
              >
                <option value="">Sin especificar</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </Field>
            {editing.index >= 0 && (
              <Button
                variant="danger"
                onClick={async () => {
                  setActionError('');
                  try {
                    await save('neo_horario', {
                      ...agenda,
                      [dateKey(date)]: tasks.filter((_, i) => i !== editing.index),
                    });
                    setEditing(null);
                  } catch (e) {
                    setActionError(errorMessage(e));
                  }
                }}
              >
                Quitar reunión
              </Button>
            )}
            {actionError && <Notice error>{actionError}</Notice>}
          </Form>
        </Modal>
      )}
    </>
  );
}
