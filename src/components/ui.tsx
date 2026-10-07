import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ArrowDown, ArrowUp, LoaderCircle, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Link } from 'react-router';
import { errorMessage } from '../lib/api';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  return (
    <button type="button" className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Field({
  label,
  children,
  hint,
  className = '',
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; 'aria-describedby'?: string }>, {
        id,
        'aria-describedby': hint ? id + '-hint' : undefined,
      })
    : children;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && <small id={id + '-hint'}>{hint}</small>}
    </div>
  );
}
export function PageHeader({
  title,
  description,
  actions,
  onRefresh,
  refreshing = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {(actions || onRefresh) && (
        <div className="page-header-actions flex flex-wrap gap-2">
          {actions}
          {onRefresh && (
            <Button
              variant="ghost"
              disabled={busy || refreshing}
              aria-label="Actualizar datos de esta página"
              onClick={async () => {
                setBusy(true);
                try {
                  await onRefresh();
                } catch {
                  /* Page/store retains drafts and presents the error. */
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy || refreshing ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <RefreshCw size={17} />
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
export function StatCard({ label, value, to }: { label: string; value: ReactNode; to?: string }) {
  const content = (
    <>
      <strong className="stat-value">{value}</strong>
      <span className="stat-label">{label}</span>
    </>
  );
  return to ? (
    <Link className="panel stat-card" to={to}>
      {content}
    </Link>
  ) : (
    <div className="panel stat-card">{content}</div>
  );
}
export function Panel({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && <h2 className="panel-title">{title}</h2>}
      {children}
    </section>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <p className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
export function Loading({ children = 'Cargando…' }: { children?: ReactNode }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="animate-spin" size={22} />
      {children}
    </div>
  );
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'info' | 'danger';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Modal({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const node = ref.current!;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`.trim()}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <Button variant="ghost" aria-label="Cerrar diálogo" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="text-muted">{description}</p>
      {error && <Notice error>{error}</Notice>}
      <div className="dialog-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Procesando…' : 'Confirmar'}
        </Button>
      </div>
    </Modal>
  );
}
export function Form({
  children,
  onSave,
  label = 'Guardar cambios',
  cancel,
  noValidate = false,
  className = '',
  scrollBody = false,
}: {
  children: ReactNode;
  onSave: (form: HTMLFormElement) => Promise<void>;
  label?: string;
  cancel?: () => void;
  noValidate?: boolean;
  className?: string;
  scrollBody?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const fields = (
    <fieldset disabled={busy} className="space-y-5">
      {children}
    </fieldset>
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError('');
    try {
      await onSave(form);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={`space-y-5 ${className}`.trim()} noValidate={noValidate}>
      {scrollBody ? <div className="form-body">{fields}</div> : fields}
      {error && <Notice error>{error}</Notice>}
      <div className="dialog-actions">
        {cancel && (
          <Button variant="secondary" disabled={busy} onClick={cancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy && <LoaderCircle className="animate-spin" size={17} />}{' '}
          {busy ? 'Guardando…' : label}
        </Button>
      </div>
    </form>
  );
}
export function Values({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="values">
      {rows.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
export function MoveButtons({
  index,
  length,
  onMove,
  onRemove,
}: {
  index: number;
  length: number;
  onMove: (direction: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        aria-label={`Subir elemento ${index + 1}`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={17} />
      </Button>
      <Button
        variant="ghost"
        aria-label={`Bajar elemento ${index + 1}`}
        disabled={index === length - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={17} />
      </Button>
      <Button variant="ghost" aria-label={`Quitar elemento ${index + 1}`} onClick={onRemove}>
        <Trash2 size={17} />
      </Button>
    </div>
  );
}
export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      <Plus size={17} />
      {children}
    </Button>
  );
}
export function text(form: HTMLFormElement, key: string) {
  return String(new FormData(form).get(key) || '').trim();
}
