import {
  ArrowRight,
  Building2,
  Camera,
  Headset,
  ListFilter,
  Radar,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { asset } from '../../components/Brand';
import { siteURL } from '../../lib/routes';
import { Matrix, Waves } from '../Effects';
import HeroElectric from '../HeroElectric';
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
          <div className="hero-visual">
            <span className="hero-ring" aria-hidden="true" />
            <span className="hero-ring hero-ring-2" aria-hidden="true" />
            <img
              className="hero-mark"
              src={asset('tigrr-dark.svg')}
              alt="Tigrr Security"
              width="380"
              height="380"
              fetchPriority="high"
            />
            <HeroElectric />
          </div>
        </div>
      </section>
      <main id="main" className="site-container">
        <Section
          id="arquitectura"
          title="Una marca, tres capas."
          description="La tecnología detecta, NEO prioriza y Tigrr Security responde."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                Building2,
                'Empresa',
                'Tigrr Security',
                'Empresa y marca principal. Seguridad que se anticipa.',
              ],
              [
                Radar,
                'Plataforma',
                'NEO',
                'Inteligencia para monitorear. Convierte cámaras, analíticas y alertas en eventos accionables.',
              ],
              [
                Headset,
                'Servicio',
                'Central Tigrr Security 24/7',
                'Supervisión, verificación y respuesta humana permanente.',
              ],
            ].map(([Icon, tag, title, description], index) => {
              const Component = Icon as typeof Building2;
              return (
                <article className="glass-card layer-card" key={tag as string}>
                  <Matrix />
                  <div className="layer-head">
                    <span className="icon-chip">
                      <Component size={22} />
                    </span>
                    <span className="layer-index" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </div>
                  <span className="eyebrow">{tag as string}</span>
                  <h3>{title as string}</h3>
                  <p>{description as string}</p>
                </article>
              );
            })}
          </div>
        </Section>
        <Section
          id="soluciones"
          title="Dos soluciones, una inteligencia."
          description="Implementa NEO en tu propia central de monitoreo o deja que Tigrr Security gestione tu seguridad desde nuestra Central 24/7."
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
        <section id="tigrr" className="public-section split-section">
          <div>
            <span className="eyebrow">Plataforma</span>
            <h2>NEO: inteligencia para monitorear mejor.</h2>
            <p className="section-description">
              NEO transforma cámaras, analíticas y alertas en eventos accionables y concentra la
              atención en lo que importa.
            </p>
            <p className="mb-6 font-semibold text-bright">NEO: menos ruido y más control.</p>
            <a href={siteURL('/neo')} className="button button-secondary rounded-full">
              Ver NEO en detalle <ArrowRight size={17} />
            </a>
          </div>
          <Checklist
            className="check-panel"
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
        <section id="central" className="public-section split-section split-reverse">
          <div>
            <span className="eyebrow">Servicio</span>
            <h2>Central Tigrr Security 24/7: personas que responden.</h2>
            <p className="section-description">
              Analizamos eventos, verificamos amenazas y actuamos según protocolos definidos para
              cada operación.
            </p>
            <a
              href={siteURL('/central-24-7')}
              className="button button-secondary mt-6 rounded-full"
            >
              Conocer la central <ArrowRight size={17} />
            </a>
          </div>
          <Checklist
            className="check-panel"
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
          description="NEO concentra la información, nuestro equipo aporta el criterio y juntos convertimos las alertas en decisiones."
        >
          <ol className="steps">
            {[
              [Camera, 'Detectamos', 'Cámaras y analíticas generan los eventos.'],
              [ListFilter, 'Priorizamos', 'NEO concentra y ordena las alertas.'],
              [Search, 'Verificamos', 'Nuestro equipo confirma qué ocurre.'],
              [ShieldCheck, 'Actuamos', 'Se aplica el protocolo definido.'],
            ].map(([Icon, label, text], index) => {
              const Component = Icon as typeof Camera;
              return (
                <li key={index} className="step">
                  <span className="step-node">
                    <Component size={22} />
                  </span>
                  <span className="step-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <strong>{label as string}</strong>
                  <span>{text as string}</span>
                </li>
              );
            })}
          </ol>
        </Section>
        <section id="contacto" className="public-section">
          <div className="cta-panel">
            <div>
              <h2>Cuéntanos qué necesitas proteger.</h2>
              <p className="section-description">
                Analizamos tu operación y te ayudamos a definir la solución adecuada para tus
                riesgos, infraestructura y necesidades.
              </p>
            </div>
            <a href={siteURL('/contacto')} className="button button-primary rounded-full px-6">
              Solicita una evaluación <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
