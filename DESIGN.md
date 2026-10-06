# Tigrr Security / NEO · Diseño v2.1

Refinamiento de la identidad existente, no reemplazo de marca.

## Web pública: informar y convertir

- Mantener fondo oscuro cálido (`#140f16`), naranja Tigrr (`#f2711c`), amarillo de foco (`#f9c22e`) y tigre original.
- CTA comercial prioritario; acceso al portal secundario. Logo del hero más compacto en móvil.
- Conservar copy y distinción empresa / plataforma / central humana. Nada de cifras, testimonios o capacidades inventadas.
- Ondas WebGL y Matrix sólo como ambiente. Efectos limitados a la superficie correspondiente, con limpieza de recursos y reducción de movimiento.
- Glassmorphism tenue en cabecera y superficies comerciales seleccionadas; texto siempre legible.
- Contenido visible por defecto; sin cortina de carga ni secciones ocultas hasta el scroll.

## Portal: operar

- Fondo NEO (`#111514`), superficies (`#1a211e`, `#252e29`), verde (`#7fca91`) para acción/foco/selección.
- Navegación agrupada en Operación, Comercial, Finanzas, Administración y Respaldo.
- Listados resumidos, filtros claros, edición contextual y formulario amplio para instalaciones.
- Estados visibles: carga, guardado confirmado, error, conflicto y vacío. Nunca confirmar una escritura sólo local.
- Estados semánticos: éxito verde, advertencia dorado, información azul y error coral, siempre con texto.

## Sistema compartido

- Geist Variable autohospedada. Cuerpo 14–16px, números tabulares, títulos con peso moderado.
- Radios: 10px controles, 16px superficies, pastilla en CTA público y badges.
- Controles de al menos 44px; inputs 46px y fuente 16px en móvil.
- Tokens CSS expuestos a Tailwind con `@theme inline`. No duplicar estilos de controles en cada página.
- Formulario: labels asociados, hints como descripción, campos preservados ante error.
- Diálogos nativos: foco, Escape, backdrop, título accesible. Menú móvil con foco contenido y retorno al disparador.
- Imprimir sólo documento activo, con fondo blanco y paginado de liquidaciones.
- Breakpoints funcionales: sidebar móvil a 900px; composición pública y campos adaptativos. Safe areas respetadas al integrar nuevos controles fijos.

La implementación vive en `src/styles/index.css` y `src/components/`. El antiguo documento `DISEÑO-NEO.md` fue reemplazado porque describía credenciales y persistencia de una versión anterior.
