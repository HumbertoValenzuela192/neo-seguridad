import { Camera, ListFilter, Search, ShieldCheck } from 'lucide-react';
import { Breadcrumb, Checklist, EvaluationCTA, Section } from '../components/Sections';

export default function CentralPage() {
  return (
    <main id="main" className="site-container">
      <Breadcrumb label="Central 24/7" />
      <section className="public-section">
        <h1 className="public-page-title">Central Tigrr Security 24/7: personas que responden.</h1>
        <p className="mt-6 text-lg text-muted">
          Analizamos eventos, verificamos amenazas y actuamos según protocolos definidos para cada
          operación.
        </p>
      </section>
      <section className="grid gap-10 pb-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl">Supervisión, verificación y respuesta humana permanente.</h2>
          <p className="mt-5 text-muted">
            Una central convencional mira cámaras. Tigrr Security detecta, analiza, verifica y
            responde.
          </p>
        </div>
        <Checklist
          items={[
            'Supervisión continua.',
            'Verificación y gestión de alertas.',
            'Protocolos personalizados.',
            'Gestión y escalamiento de incidentes.',
            'Reportabilidad y trazabilidad.',
            'Soporte operacional permanente.',
          ]}
        />
      </section>
      <Section
        title="De alertas a decisiones."
        description="NEO concentra la información, nuestro equipo aporta el criterio y juntos convertimos las alertas en decisiones."
      >
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Camera, 'Detectamos'],
            [ListFilter, 'Priorizamos'],
            [Search, 'Verificamos'],
            [ShieldCheck, 'Actuamos'],
          ].map(([Icon, label], i) => {
            const Component = Icon as typeof Camera;
            return (
              <li className="flex items-center gap-3" key={i}>
                <Component size={28} className="text-accent" />
                <strong>{label as string}</strong>
              </li>
            );
          })}
        </ol>
      </Section>
      <EvaluationCTA />
    </main>
  );
}
