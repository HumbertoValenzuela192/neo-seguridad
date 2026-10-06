import type { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { siteURL } from '../../lib/routes';

export function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="check-list">
      {items.map((item) => (
        <li key={item}>
          <Check size={17} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="public-section">
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
      {children}
    </section>
  );
}

export function Breadcrumb({ label }: { label: string }) {
  return (
    <div className="pt-7 text-sm text-muted">
      <a href={siteURL('/')} className="hover:text-bright">
        Inicio
      </a>
      <span aria-hidden="true"> / </span>
      <span>{label}</span>
    </div>
  );
}

export function EvaluationCTA() {
  return (
    <section className="public-section border-t border-line">
      <h2>Definamos la solución para tu operación.</h2>
      <p className="section-description">Analizamos tus riesgos, infraestructura y necesidades.</p>
      <a href={siteURL('/contacto')} className="button button-primary rounded-full">
        Solicita una evaluación <ArrowRight size={18} />
      </a>
    </section>
  );
}
