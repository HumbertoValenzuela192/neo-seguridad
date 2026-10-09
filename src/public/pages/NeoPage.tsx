import { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Waves } from '../Effects';
import NeoGlobe from '../NeoGlobe';
import { siteURL } from '../../lib/routes';
import { Checklist, Section } from '../components/Sections';

declare global {
  interface Window {
    __heroManaged?: boolean;
  }
}

export default function NeoPage() {
  // Entrada coordinada del hero: todo espera a que el globo esté listo y aparece a la vez.
  const [phase, setPhase] = useState<'hold' | 'go' | 'done'>('hold');
  const release = useCallback(() => setPhase((p) => (p === 'hold' ? 'go' : p)), []);
  useEffect(() => {
    // Si el respaldo del <head> ya mostró el hero (JavaScript muy lento), no se vuelve a animar:
    // ocultarlo para reanimarlo se vería como un parpadeo.
    window.__heroManaged = true;
    if (matchMedia('(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)').matches)
      setPhase('done');
    if (document.documentElement.classList.contains('hero-failsafe')) setPhase('done');
  }, []);
  useEffect(() => {
    if (phase !== 'go') return;
    const timer = window.setTimeout(() => setPhase('done'), 1600);
    return () => clearTimeout(timer);
  }, [phase]);
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
      <section className="public-hero neo-hero" data-hero={phase}>
        <Waves />
        <div className="site-container relative grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1>Inteligencia para monitorear mejor.</h1>
            <p className="hero-description">
              NEO transforma cámaras, analíticas y alertas en eventos accionables y concentra la
              atención en lo que importa.
            </p>
            <p className="hero-tagline mb-6 text-bright">NEO: menos ruido y más control.</p>
            <div className="flex flex-wrap gap-3">
              <a href={siteURL('/contacto')} className="button button-primary rounded-full">
                Contáctanos
              </a>
            </div>
          </div>
          <NeoGlobe onSettled={release} />
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
            relaciona con la demanda de gestión y no sólo con el total de cámaras.
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
          description="NEO permite dimensionar la dotación según el trabajo que llega al operador"
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
          title="NEO cambia la forma de dimensionar una central"
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
