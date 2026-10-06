import { ArrowRight, Camera, ListFilter, Search, ShieldCheck } from 'lucide-react';
import { asset } from '../../components/Brand';
import { siteURL } from '../../lib/routes';
import { Matrix, Waves } from '../Effects';
import { Checklist, Section } from '../components/Sections';

export default function HomePage() {
  return (
    <>
      <section className="public-hero">
        <Waves />
        <div className="site-container relative grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h1>Seguridad que se anticipa.</h1>
            <p className="hero-description">
              Vemos la amenaza antes de que se convierta en un problema. Tecnología, inteligencia y
              monitoreo 24/7 para anticiparnos a los riesgos y proteger tu operación.
            </p>
            <a href={siteURL('/contacto')} className="button button-primary rounded-full px-6">
              Solicita una evaluación <ArrowRight size={18} />
            </a>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              className="hero-mark"
              src={asset('tigrr.png')}
              alt="Tigrr Security"
              width="380"
              height="380"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>
      <main id="main" className="site-container">
        <Section
          id="arquitectura"
          title="Una marca, tres capas."
          description="La seguridad tradicional reacciona. NEO se anticipa: la tecnología detecta, NEO prioriza y Tigrr Security responde."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                'Empresa',
                'Tigrr Security',
                'Empresa y marca principal. Seguridad que se anticipa.',
              ],
              [
                'Plataforma',
                'NEO',
                'Inteligencia para monitorear. Convierte cámaras, analíticas y alertas en eventos accionables.',
              ],
              [
                'Servicio',
                'Central Tigrr Security 24/7',
                'Supervisión, verificación y respuesta humana permanente.',
              ],
            ].map(([tag, title, description]) => (
              <article className="glass-card" key={tag}>
                <Matrix />
                <span className="text-sm text-bright">{tag}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p className="mt-7 text-sm text-muted">
            La tecnología detecta. NEO prioriza. Tigrr Security responde.
          </p>
        </Section>
        <Section
          id="soluciones"
          title="Dos soluciones, una inteligencia."
          description="Implementa NEO en tu propia central de monitoreo o deja que Tigrr Security gestione completamente tu seguridad desde nuestra Central 24/7."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <article className="glass-card flex flex-col">
              <h3>Tigrr Security · Monitoreo 24/7</h3>
              <p>
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
              <a
                href={siteURL('/central-24-7')}
                className="button button-primary mt-auto self-start rounded-full"
              >
                Conocer el servicio <ArrowRight size={17} />
              </a>
            </article>
            <article className="glass-card flex flex-col">
              <h3>NEO · Plataforma de monitoreo</h3>
              <p>
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
              <a
                href={siteURL('/neo')}
                className="button button-secondary mt-auto self-start rounded-full"
              >
                Conocer NEO <ArrowRight size={17} />
              </a>
            </article>
          </div>
        </Section>
        <section
          id="tigrr"
          className="public-section grid gap-10 border-t border-line md:grid-cols-2"
        >
          <div>
            <h2>NEO: inteligencia para monitorear mejor.</h2>
            <p className="section-description">
              NEO transforma cámaras, analíticas y alertas en eventos accionables, concentrando la
              atención donde realmente importa.
            </p>
            <p className="mb-6 text-bright">NEO — menos ruido. Más control.</p>
            <a href={siteURL('/neo')} className="button button-secondary rounded-full">
              Ver NEO en detalle <ArrowRight size={17} />
            </a>
          </div>
          <Checklist
            items={[
              'Centralización de eventos de seguridad.',
              'Gestión inteligente de alertas.',
              'Visualización y verificación.',
              'Gestión operacional en tiempo real.',
              'Trazabilidad de incidentes.',
              'Reportes e indicadores.',
              'Integración con infraestructura de seguridad.',
              'Escalabilidad según la operación.',
            ]}
          />
        </section>
        <section
          id="central"
          className="public-section grid gap-10 border-t border-line md:grid-cols-2"
        >
          <div>
            <h2>Central Tigrr Security 24/7: personas que responden.</h2>
            <p className="section-description">
              No solo observamos cámaras. Analizamos eventos, verificamos amenazas y actuamos según
              protocolos definidos para cada operación.
            </p>
            <p className="text-bright">
              Una central convencional mira cámaras. Tigrr Security detecta, analiza, verifica y
              responde.
            </p>
            <a
              href={siteURL('/central-24-7')}
              className="button button-secondary mt-6 rounded-full"
            >
              Conocer la central <ArrowRight size={17} />
            </a>
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
          id="proceso"
          title="De alertas a decisiones."
          description="De miles de alertas a las que realmente importan. NEO concentra la información, nuestro equipo aporta el criterio y juntos convertimos eventos en decisiones."
        >
          <ol className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              [Camera, 'Detectamos'],
              [ListFilter, 'Priorizamos'],
              [Search, 'Verificamos'],
              [ShieldCheck, 'Actuamos'],
            ].map(([Icon, label], index) => {
              const Component = Icon as typeof Camera;
              return (
                <li key={index} className="flex items-center gap-3">
                  <Component size={28} className="text-accent" />
                  <strong className="text-sm">{label as string}</strong>
                </li>
              );
            })}
          </ol>
        </Section>
        <section
          id="contacto"
          className="public-section grid gap-10 border-t border-line lg:grid-cols-2"
        >
          <div>
            <h2>Cuéntanos qué necesitas proteger.</h2>
            <p className="section-description">
              Analizamos tu operación y te ayudamos a definir la solución adecuada para tus riesgos,
              infraestructura y necesidades.
            </p>
          </div>
          <div className="flex items-center">
            <a href={siteURL('/contacto')} className="button button-primary rounded-full px-6">
              Solicita una evaluación <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
