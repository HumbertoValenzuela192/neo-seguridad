# Tigrr Security / NEO · Diseño v2.1

Refinamiento de la identidad existente, no reemplazo de marca.

## Web pública: informar y convertir

- Mantener fondo oscuro cálido (`#140f16`), naranja Tigrr (`#f2711c`), amarillo de foco (`#f9c22e`) y tigre original.
- CTA comercial prioritario; sin acceso al panel interno en la navegación pública. Logo del hero más compacto en móvil.
- Conservar copy y distinción empresa / plataforma / central humana. Nada de cifras, testimonios o capacidades inventadas.
- Ondas WebGL y Matrix sólo como ambiente. Efectos limitados a la superficie correspondiente, con limpieza de recursos y reducción de movimiento.
- Glassmorphism tenue en cabecera y superficies comerciales seleccionadas; texto siempre legible.
- Contenido visible por defecto; sin cortina de carga ni secciones ocultas hasta el scroll.
- Inicio en `/`, con páginas propias para `/soluciones`, `/neo`, `/central-24-7` y `/contacto`. Navegación principal indica la página actual; títulos y metadatos públicos se prerenderizan.

## Portal: operar

- Fondo negro (`#000000`), superficies verdes existentes (`#1a211e`, `#252e29`), verde (`#7fca91`) para acción/foco/selección. El fondo negro se aplica sólo al portal.
- Navegación agrupada en Operación, Comercial, Finanzas, Administración y Respaldo.
- Barra lateral siempre expandida en escritorio (224px). Cabecera de 56px: logo de 32px y saludo en dos líneas ("Bienvenido," secundario y nombre del usuario). Menú con scroll propio; pie compacto sólo con iconos accesibles de Configuración y cierre de sesión. Volver al sitio y Respaldo se acceden desde Configuración; una recuperación pendiente mantiene aviso directo. La confirmación de guardado aparece sólo cuando hay una operación, fuera del pie.
- Geometría alineada con la consola NEO: margen y separación del shell de 12px, paneles de 16px, títulos de página de 20px/600 y cuerpo de 14px. Cabeceras y filtros sobre el fondo negro sin tarjetas adicionales; las tarjetas de datos conservan el verde oscuro. Agenda con controles agrupados y estado vacío compacto. Sin glows ni sombras estructurales decorativas.
- Secciones bajo `/admin/...` con navegación History API, recarga directa y compatibilidad de URLs anteriores. Agenda también tiene una vista propia en `/admin/agenda`.
- Listados resumidos, filtros claros, edición contextual y formulario amplio para instalaciones.
- Patrón común `PageHeader → búsqueda/filtros → listado/detalle`. Crear/editar en diálogos cuando corresponde, acciones de filas consistentes y listados compactos; directorio en tabla de escritorio y tarjetas móviles.
- Inicio: indicadores compactos y agenda prioritaria; resumen hablado como bloque secundario desplegable. Usuarios y Roles: navegación común con pestañas y permisos independientes.
- Fichas: General / Ubicación / Contactos / Guardias y supervisor. Estado del formulario preservado entre pestañas, foco en el campo inválido y acciones de guardado visibles.
- Estados visibles: carga, guardado confirmado, error, conflicto y vacío. Nunca confirmar una escritura sólo local.
- Estados semánticos: éxito verde, advertencia dorado, información azul y error coral, siempre con texto.

## Sistema compartido

- Geist Variable autohospedada. Cuerpo 14–16px, números tabulares, títulos con peso moderado.
- Radios: 10px controles, 15px superficies del portal (16px públicas), pastilla en CTA público y badges.
- Portal de escritorio: controles compactos de 32–36px, navegación de 36px. En móvil o puntero táctil, objetivos de al menos 44px; inputs 46px y fuente 16px en móvil.
- Tokens CSS expuestos a Tailwind con `@theme inline`. No duplicar estilos de controles en cada página.
- La reorganización administrativa conserva los colores actuales de paneles, estados, bordes y botones; la única sustitución cromática es el fondo general negro. Sus estilos viven en `src/portal/portal.css`, bajo `.portal-theme` y `.portal-admin`.
- Formulario: labels asociados, hints como descripción, campos preservados ante error.
- Diálogos nativos: foco, Escape, backdrop, título accesible. Menú móvil con foco contenido y retorno al disparador.
- Imprimir sólo documento activo, con fondo blanco y paginado de liquidaciones.
- Breakpoints funcionales: sidebar móvil a 900px; composición pública y campos adaptativos. Safe areas respetadas al integrar nuevos controles fijos.

La implementación vive en `src/styles/index.css` y `src/components/`. El antiguo documento `DISEÑO-NEO.md` fue reemplazado porque describía credenciales y persistencia de una versión anterior.
