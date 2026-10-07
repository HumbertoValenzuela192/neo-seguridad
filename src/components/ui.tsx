import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { errorMessage } from '../lib/api';
export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  const id = useId();
  const control = isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string; 'aria-describedby'?: string }>, { id, 'aria-describedby': hint ? id + '-hint' : undefined }) : children;
  return <div className={`field ${className}`}><label htmlFor={id}>{label}</label>{control}{hint && <small id={id + '-hint'}>{hint}</small>}</div>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</p>;
}
export function Form({ children, onSave, label = 'Guardar cambios' }: { children: ReactNode; onSave: (form: HTMLFormElement) => Promise<void>; label?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; setBusy(true); setError('');
    try { await onSave(form); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-5">{children}</fieldset>{error && <Notice error>{error}</Notice>}<div className="dialog-actions"><button type="submit" disabled={busy} className="button button-primary">{busy && <LoaderCircle className="animate-spin" size={17} />}{' '}{busy ? 'Guardando…' : label}</button></div></form>;
}
export function text(form: HTMLFormElement, key: string) { return String(new FormData(form).get(key) || '').trim(); }
