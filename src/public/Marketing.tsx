import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Camera, Check, ListFilter, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { Form, Field, Notice, text } from '../components/ui';
import { request } from '../lib/api';
import { nowLabel, validRut } from '../lib/domain';
import { Matrix, Waves } from './Effects';
import { asset, Brand } from '../components/Brand';
import { siteURL, type PublicPage } from '../lib/routes';

function Country() {
  const [country, setCountry] = useState<{ name: string; code: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      for (const url of [
        'https://ipwho.is/',
        'https://get.geojs.io/v1/ip/country.json',
        'https://api.country.is/',
      ]) {
        try {
          const response = await fetch(url, { signal: controller.signal });
          const d = await response.json();
          const code = d.country_code || d.country;
          if (response.ok && d.success !== false && /^[a-z]{2}$/i.test(code)) {
            setCountry({ name: d.name || d.country || code, code });
            return;
          }
        } catch {
          if (controller.signal.aborted) return;
        }
      }
    })();
    return () => controller.abort();
  }, []);
  return country ? (
    <span className="hidden items-center gap-2 text-xs text-muted xl:flex">
      <img
        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
        alt=""
        width="20"
        height="15"
      />
      {country.name}
    </span>
  ) : null;
}
function Header({ page }: { page: PublicPage }) {
  const neo = page === 'neo';
  const [open, setOpen] = useState(false);
  const links = [
    ['/', 'Inicio'],
    ['/soluciones', 'Soluciones'],
    ['/neo', 'NEO'],
    ['/central-24-7', 'Central 24/7'],
    ['/contacto', 'Contacto'],
  ];
  const active = {
    home: '/',
    solutions: '/soluciones',
    neo: '/neo',
    central: '/central-24-7',
    contact: '/contacto',
  }[page];
  return (
    <header className="site-header">
      <div className="site-container flex min-h-18 items-center justify-between gap-4">
        <Brand neo={neo} />
        <div className="flex items-center gap-3">
          <nav
            className="hidden items-center gap-6 text-sm text-muted lg:flex"
            aria-label="Navegación principal"
          >
            {links.map(([href, label]) => (
              <a
                key={href}
                href={siteURL(href)}
                aria-current={active === href ? 'page' : undefined}
                className={active === href ? 'text-bright' : 'hover:text-bright'}
              >
                {label}
              </a>
            ))}
          </nav>
          <Country />
          <a href={siteURL('/admin')} className="button button-ghost hidden sm:inline-flex">
            Acceso al portal
          </a>
          <a className="button button-primary rounded-full" href={siteURL('/contacto')}>
            {neo ? 'Contáctanos' : 'Evaluación'}
          </a>
          <button
            type="button"
            className="button button-secondary lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Navegación móvil"
          className="site-container grid gap-1 border-t border-line py-3 lg:hidden"
        >
          {links.map(([href, label]) => (
            <a
              className="rounded-lg px-3 py-3 text-sm hover:bg-raised"
              key={href}
              href={siteURL(href)}
              aria-current={active === href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <a className="rounded-lg px-3 py-3 text-sm text-bright" href={siteURL('/admin')}>
            Acceso al portal
          </a>
        </nav>
      )}
    </header>
  );
}
function Checklist({ items }: { items: string[] }) {
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
function Section({
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
function ContactForm() {
  const [solution, setSolution] = useState(''),
    [sent, setSent] = useState(false);
  return (
    <div className="panel">
      {sent ? (
        <div className="space-y-5">
          <ShieldCheck size={36} className="text-accent" />
          <h3 className="text-xl">Gracias por contactarnos.</h3>
          <Notice>Nos comunicaremos con usted en las próximas 48 horas hábiles.</Notice>
          <button className="button button-secondary" onClick={() => setSent(false)}>
            Enviar otra solicitud
          </button>
        </div>
      ) : (
        <Form
          label="Solicitar evaluación"
          onSave={async (form) => {
            if (!validRut(text(form, 'rut')))
              throw new Error('RUT inválido. Revisa el dígito verificador.');
            const values = Object.fromEntries(new FormData(form).entries());
            await request('/leads', 'POST', {
              ...values,
              id: crypto.randomUUID(),
              date: nowLabel(),
              status: 'nuevo',
            });
            setSent(true);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Empresa">
              <input name="company" autoComplete="organization" required />
            </Field>
            <Field label="RUT">
              <input name="rut" placeholder="12.345.678-5" required />
            </Field>
            <Field label="Nombre del contacto">
              <input name="manager" autoComplete="name" required />
            </Field>
            <Field label="Correo corporativo">
              <input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Teléfono">
              <input name="phone" type="tel" autoComplete="tel" required />
            </Field>
            <Field label="Cantidad de cámaras">
              <input name="cameras" type="number" min="1" step="1" required />
            </Field>
          </div>
          <Field label="Solución">
            <select
              name="solution"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              required
            >
              <option value="">Selecciona una opción</option>
              <option>NEO</option>
              <option>Monitoreo 24/7</option>
              <option>Ambos</option>
            </select>
          </Field>
          {solution === 'NEO' && (
            <Field label="Cantidad de operadores">
              <input name="operators" type="number" min="1" step="1" required />
            </Field>
          )}
        </Form>
      )}
    </div>
  );
}
export function Marketing({ page = 'home' }: { page?: PublicPage }) {
  const neo = page === 'neo';
  return (
    <div className={`public-page ${neo ? 'theme-neo' : ''}`}>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Header page={page} />
      {neo ? (
        <NeoPage />
      ) : page !== 'home' ? (
        <CommercialPage page={page} />
      ) : (
        <>
          <section className="public-hero">
            <Waves />
            <div className="site-container relative grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
              <div>
                <h1>Seguridad que se anticipa.</h1>
                <p className="hero-description">
                  Vemos la amenaza antes de que se convierta en un problema. Tecnología,
                  inteligencia y monitoreo 24/7 para anticiparnos a los riesgos y proteger tu
                  operación.
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
                    Para organizaciones que prefieren delegar la supervisión, verificación y gestión
                    de eventos a un equipo especializado.
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
                    Para empresas y centrales que quieren administrar su propia operación con
                    tecnología NEO.
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
                  NEO transforma cámaras, analíticas y alertas en eventos accionables, concentrando
                  la atención donde realmente importa.
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
                  No solo observamos cámaras. Analizamos eventos, verificamos amenazas y actuamos
                  según protocolos definidos para cada operación.
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
                  Analizamos tu operación y te ayudamos a definir la solución adecuada para tus
                  riesgos, infraestructura y necesidades.
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
      )}
      <footer className="public-footer">
        <div className="site-container flex flex-wrap justify-between gap-4">
          <small>
            © {new Date().getFullYear()}{' '}
            {neo
              ? 'NEO Seguridad. Menos ruido. Más control.'
              : 'Tigrr Security. Seguridad que se anticipa.'}
          </small>
          <a href={siteURL('/admin')} className="hover:text-bright">
            Acceso al portal
          </a>
        </div>
      </footer>
    </div>
  );
}
function NeoPage() {
  const problems = [
    ['Demasiadas señales', 'Alertas sin relevancia compiten por la atención del operador.'],
    [
      'Visualización continua',
      'La carga se dimensiona por cámaras y rondas, aunque muchas escenas no tengan actividad.',
    ],
    [
      'Herramientas fragmentadas',
      'Video, alarmas, mensajería y registros obligan a cambiar de plataforma.',
    ],
    [
      'Criterios variables',
      'La respuesta depende de experiencia, memoria y disciplina individual.',
    ],
    [
      'Trazabilidad incompleta',
      'La reconstrucción del incidente exige reunir datos desde distintas fuentes.',
    ],
    [
      'Dotación defensiva',
      'Las centrales agregan personas para compensar ruido, dispersión y riesgo humano.',
    ],
  ];
  const capabilities = [
    ['Centralización', 'Reúne eventos y contexto en una sola vista operacional.'],
    ['Filtrado efectivo', 'Reduce alertas asociadas a movimientos sin valor para el protocolo.'],
    ['Priorización', 'Ordena la atención por criticidad, horario, sitio y regla definida.'],
    ['Trazabilidad', 'Registra alerta, revisión, decisión, contacto y cierre del evento.'],
    ['Protocolos', 'Guía al operador con acciones asociadas a cada tipo de incidente.'],
    ['Indicadores', 'Entrega datos para medir carga, tiempos, cumplimiento y desempeño.'],
    [
      'Escalabilidad',
      'Permite crecer en sitios y dispositivos sin replicar la misma carga humana.',
    ],
    [
      'Integración',
      'Conecta la operación con infraestructura y canales definidos por el proyecto.',
    ],
  ];
  return (
    <>
      <section className="public-hero">
        <div className="site-container grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1>Inteligencia para monitorear mejor.</h1>
            <p className="hero-description">
              NEO transforma cámaras, analíticas y alertas en eventos accionables, concentrando la
              atención donde realmente importa.
            </p>
            <p className="mb-6 text-bright">NEO — menos ruido. Más control.</p>
            <div className="flex flex-wrap gap-3">
              <a href={siteURL('/contacto')} className="button button-primary rounded-full">
                Contáctanos
              </a>
              <a href={siteURL('/')} className="button button-secondary rounded-full">
                Volver a Tigrr Security
              </a>
            </div>
          </div>
          <img
            src={asset('neo-globo.png')}
            alt="Neo Software de Monitoreo"
            width="480"
            height="399"
            className="hero-mark hero-mark-neo"
          />
        </div>
      </section>
      <main id="main" className="site-container">
        <Section
          title="NEO nace de problemas repetidos en las centrales"
          description="La tecnología creció más rápido que la capacidad humana para revisarla"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {problems.map(([title, description]) => (
              <article key={title} className="border-t border-line pt-5">
                <h3 className="mb-3 text-lg">{title}</h3>
                <p className="text-sm text-muted">{description}</p>
              </article>
            ))}
          </div>
        </Section>
        <Section
          title="El ruido operacional aumenta el riesgo y la dotación"
          description="Una alerta irrelevante consume tiempo y desplaza la atención de la siguiente"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                'Exceso de alertas',
                'El operador recibe más señales de las que puede revisar con profundidad.',
              ],
              [
                'Atención fragmentada',
                'La revisión rápida favorece omisiones, respuestas tardías y decisiones inconsistentes.',
              ],
              [
                'Más personas para absorber carga',
                'La dotación crece para sostener un modelo que aún depende del volumen bruto.',
              ],
            ].map(([title, p]) => (
              <article className="glass-card" key={title}>
                <h3>{title}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-bright">
            NEO interviene antes de que el ruido llegue al operador
          </p>
        </Section>
        <Section
          title="La unidad de trabajo cambia a eventos efectivos"
          description="NEO concentra la intervención humana donde existe movimiento relevante"
        >
          <ol className="grid gap-4 md:grid-cols-4">
            {[
              ['Cámaras y sistemas', 'Flujo continuo de video y señales'],
              ['Movimiento detectado', 'El sistema identifica actividad'],
              ['Alerta efectiva', 'Reglas y contexto filtran el ruido'],
              ['Intervención humana', 'El operador verifica y ejecuta protocolo'],
            ].map(([title, p], i) => (
              <li key={title} className="border-t border-line pt-5">
                <span className="text-accent">{i + 1}</span>
                <h3 className="my-3 text-lg">{title}</h3>
                <p className="text-sm text-muted">{p}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-muted">
            Resultado: menos eventos sin valor llegan a la central. La capacidad operativa se
            relaciona con la demanda real de gestión, no solo con el total de cámaras.
          </p>
        </Section>
        <Section title="NEO organiza el ciclo completo de atención">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                'Recibe',
                'Integra eventos provenientes de cámaras, analíticas y dispositivos compatibles.',
              ],
              [
                'Filtra',
                'Valida movimiento y aplica reglas para descartar señales sin valor operacional.',
              ],
              [
                'Prioriza',
                'Ordena las alertas según tipo de evento, sitio, horario y nivel de atención.',
              ],
              [
                'Gestiona',
                'Entrega contexto al operador, registra acciones y conserva la trazabilidad.',
              ],
            ].map(([title, p]) => (
              <article key={title} className="glass-card">
                <h3>{title}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-bright">
            El operador recibe una cola de trabajo priorizada y respaldada por evidencia
          </p>
        </Section>
        <Section id="capacidades" title="Capacidades operativas de NEO">
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(([title, p]) => (
              <article className="border-t border-line pt-4" key={title}>
                <h3 className="mb-3 text-lg">{title}</h3>
                <p className="text-sm text-muted">{p}</p>
              </article>
            ))}
          </div>
        </Section>
        <Section
          title="El filtrado efectivo reduce la demanda de atención humana"
          description="NEO permite dimensionar la dotación según el trabajo que realmente llega al operador"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <article className="glass-card">
              <h3>Modelo tradicional</h3>
              <Checklist
                items={[
                  'Cantidad total de cámaras',
                  'Frecuencia de rondas',
                  'Volumen bruto de alarmas',
                  'Cambios entre múltiples plataformas',
                ]}
              />
            </article>
            <article className="glass-card">
              <h3>Modelo NEO</h3>
              <Checklist
                items={[
                  'Alertas efectivas recibidas',
                  'Tiempo medio de verificación',
                  'Complejidad del protocolo',
                  'Nivel de automatización e integración',
                ]}
              />
            </article>
          </div>
          <p className="mt-6 text-muted">
            Impacto esperado: menor necesidad de operadores por cámara monitoreada, con una dotación
            calculada mediante piloto y datos reales de eventos.
          </p>
          <p className="mt-3 text-sm text-muted">
            NEO habilita la reducción de dotación. El porcentaje depende de la tasa de alertas
            efectivas, horarios, protocolos e integraciones de cada operación.
          </p>
        </Section>
        <Section title="NEO mejora la operación, la supervisión y el servicio">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              [
                'Operación',
                [
                  'Menos ruido en la cola de trabajo',
                  'Atención concentrada en eventos relevantes',
                  'Menor tiempo perdido en señales sin acción',
                ],
              ],
              [
                'Personas',
                [
                  'Menor fatiga por vigilancia continua',
                  'Criterios guiados por protocolo',
                  'Capacidad humana enfocada en decidir y responder',
                ],
              ],
              [
                'Gestión',
                [
                  'Trazabilidad completa del evento',
                  'Indicadores para dimensionar y supervisar',
                  'Evidencia para detectar brechas y capacitar',
                ],
              ],
              [
                'Cliente',
                [
                  'Respuesta más consistente',
                  'Mayor visibilidad del servicio',
                  'Crecimiento sin replicar linealmente la dotación',
                ],
              ],
            ].map(([title, items]) => (
              <article key={title as string} className="border-t border-line pt-5">
                <h3 className="text-xl">{title as string}</h3>
                <Checklist items={items as string[]} />
              </article>
            ))}
          </div>
        </Section>
        <Section id="implementacion" title="La reducción de carga se valida con un piloto medible">
          <ol className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {[
              ['Línea base', 'Cámaras, alertas, dotación y tiempos actuales.'],
              ['Configuración', 'Reglas, horarios, criticidad y protocolos.'],
              ['Piloto', 'Operación controlada y ajuste de filtros.'],
              ['Escala', 'Dimensionamiento y despliegue progresivo.'],
            ].map(([title, p], i) => (
              <li className="border-t border-line pt-5" key={title}>
                <span className="text-accent">{i + 1}</span>
                <h3 className="my-3 text-lg">{title}</h3>
                <p className="text-sm text-muted">{p}</p>
              </li>
            ))}
          </ol>
          <h3 className="mt-10 text-xl">Indicadores para decidir</h3>
          <Checklist
            items={[
              'Tasa de alertas efectivas',
              'Falsos positivos',
              'Tiempo medio de verificación',
              'Eventos gestionados por operador',
              'Cumplimiento de protocolo',
              'Incidentes detectados y no detectados',
            ]}
          />
          <p className="text-bright">
            La decisión sobre dotación debe apoyarse en resultados medidos, no en una promesa
            genérica de ahorro
          </p>
        </Section>
        <Section
          title="NEO — Cambia la forma de dimensionar una central"
          description="La operación deja de organizarse solo alrededor de cámaras y se concentra en alertas efectivas que requieren criterio humano."
        >
          <p className="mb-7 text-muted">
            Eso permite reducir ruido, estandarizar la respuesta y disminuir la necesidad de recurso
            humano por cámara monitoreada.
          </p>
          <a href={siteURL('/contacto')} className="button button-primary rounded-full">
            Contáctanos <ArrowRight size={17} />
          </a>
        </Section>
      </main>
    </>
  );
}

function CommercialPage({ page }: { page: Exclude<PublicPage, 'home' | 'neo'> }) {
  const content = {
    solutions: {
      title: 'Dos soluciones, una inteligencia.',
      description:
        'Implementa NEO en tu propia central de monitoreo o deja que Tigrr Security gestione completamente tu seguridad desde nuestra Central 24/7.',
    },
    central: {
      title: 'Central Tigrr Security 24/7: personas que responden.',
      description:
        'No solo observamos cámaras. Analizamos eventos, verificamos amenazas y actuamos según protocolos definidos para cada operación.',
    },
    contact: {
      title: 'Cuéntanos qué necesitas proteger.',
      description:
        'Analizamos tu operación y te ayudamos a definir la solución adecuada para tus riesgos, infraestructura y necesidades.',
    },
  }[page];
  return (
    <main id="main" className="site-container">
      <div className="pt-7 text-sm text-muted">
        <a href={siteURL('/')} className="hover:text-bright">
          Inicio
        </a>
        <span aria-hidden="true"> / </span>
        <span>
          {page === 'solutions' ? 'Soluciones' : page === 'central' ? 'Central 24/7' : 'Contacto'}
        </span>
      </div>
      {page === 'contact' ? (
        <section className="public-section grid gap-10 lg:grid-cols-2">
          <div>
            <h1 className="public-page-title">{content.title}</h1>
            <p className="mt-6 text-muted">{content.description}</p>
            <p className="mt-6 text-sm text-muted">
              Selecciona la solución y completa los datos de tu operación para solicitar una
              evaluación.
            </p>
          </div>
          <ContactForm />
        </section>
      ) : (
        <>
          <section className="public-section">
            <h1 className="public-page-title">{content.title}</h1>
            <p className="mt-6 text-lg text-muted">{content.description}</p>
          </section>
          {page === 'solutions' ? (
            <section
              className="pb-12 grid gap-6 md:grid-cols-2"
              aria-label="Soluciones disponibles"
            >
              <article className="glass-card flex flex-col">
                <h2 className="text-2xl">Tigrr Security · Monitoreo 24/7</h2>
                <p className="mt-4">
                  Para organizaciones que prefieren delegar la supervisión, verificación y gestión
                  de eventos a un equipo especializado.
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
                  className="button button-secondary self-start mt-auto"
                >
                  Conocer la central <ArrowRight size={17} />
                </a>
              </article>
              <article className="glass-card flex flex-col">
                <h2 className="text-2xl">NEO · Plataforma de monitoreo</h2>
                <p className="mt-4">
                  Para empresas y centrales que quieren administrar su propia operación con
                  tecnología NEO.
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
          ) : (
            <>
              <section className="grid gap-10 pb-12 md:grid-cols-2">
                <div>
                  <h2 className="text-2xl">
                    Supervisión, verificación y respuesta humana permanente.
                  </h2>
                  <p className="mt-5 text-muted">
                    Una central convencional mira cámaras. Tigrr Security detecta, analiza, verifica
                    y responde.
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
                description="De miles de alertas a las que realmente importan. NEO concentra la información, nuestro equipo aporta el criterio y juntos convertimos eventos en decisiones."
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
            </>
          )}
          <section className="public-section border-t border-line">
            <h2>Definamos la solución para tu operación.</h2>
            <p className="section-description">
              Analizamos tus riesgos, infraestructura y necesidades.
            </p>
            <a href={siteURL('/contacto')} className="button button-primary rounded-full">
              Solicita una evaluación <ArrowRight size={18} />
            </a>
          </section>
        </>
      )}
    </main>
  );
}
