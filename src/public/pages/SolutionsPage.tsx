import { ArrowRight } from 'lucide-react';
import { siteURL } from '../../lib/routes';
import { Breadcrumb, Checklist, EvaluationCTA } from '../components/Sections';

export default function SolutionsPage() {
  return (
    <main id="main" className="site-container">
      <Breadcrumb label="Soluciones" />
      <section className="public-section">
        <h1 className="public-page-title">Dos soluciones, una inteligencia.</h1>
        <p className="mt-6 text-lg text-muted">
          Implementa NEO en tu propia central de monitoreo o deja que Tigrr Security gestione
          completamente tu seguridad desde nuestra Central 24/7.
        </p>
      </section>
      <section className="pb-12 grid gap-6 md:grid-cols-2" aria-label="Soluciones disponibles">
        <article className="glass-card flex flex-col">
          <h2 className="text-2xl">Tigrr Security · Monitoreo 24/7</h2>
          <p className="mt-4">
            Para organizaciones que prefieren delegar la supervisión, verificación y gestión de
            eventos a un equipo especializado.
          </p>
          <Checklist
            items={[
              'Supervisión continua 24/7.',
              'Verificación y gestión de alertas.',
              'Protocolos personalizados.',
              'Soporte operacional permanente.',
            ]}
          />
          <a href={siteURL('/central-24-7')} className="button button-secondary self-start mt-auto">
            Conocer la central <ArrowRight size={17} />
          </a>
        </article>
        <article className="glass-card flex flex-col">
          <h2 className="text-2xl">NEO · Plataforma de monitoreo</h2>
          <p className="mt-4">
            Para empresas y centrales que quieren administrar su propia operación con tecnología
            NEO.
          </p>
          <Checklist
            items={[
              'Centralización de eventos de seguridad.',
              'Gestión inteligente de alertas.',
              'Visualización y verificación.',
              'Integración con tu infraestructura.',
            ]}
          />
          <a href={siteURL('/neo')} className="button button-secondary self-start mt-auto">
            Conocer NEO <ArrowRight size={17} />
          </a>
        </article>
      </section>
      <EvaluationCTA />
    </main>
  );
}
