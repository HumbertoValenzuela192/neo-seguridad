# NEO — Sistema de diseño (para reimplementar en otra web)

Documento de referencia para portar el diseño de **NEO** (tema verde) a otro proyecto.
Incluye tokens, componentes, animaciones, layout, accesibilidad y los flujos del portal.

---

## 1. Identidad

- **Marca**: NEO Seguridad · "Software de Monitoreo".
- **Estilo**: oscuro (dark), glassmorphism sutil, acento verde, mucho aire, esquinas redondeadas, micro-interacciones suaves.
- **Tono visual**: tecnológico, sobrio, profesional.

---

## 2. Tokens de diseño

### 2.1 Paleta (tema NEO)

```css
:root {
  /* Superficies */
  --bg: #111514;              /* Fondo general */
  --surface: #191f1d;         /* Tarjetas / superficies */
  --surface-raised: #222a27;  /* Superficie elevada (hover, inputs agrupados) */

  /* Texto */
  --ink: #edf3ee;             /* Texto principal */
  --muted: #c3cec6;           /* Texto secundario */

  /* Bordes */
  --line: #35403b;

  /* Acento */
  --accent: #7fca91;          /* Verde principal */
  --accent-bright: #b2e7bd;   /* Verde claro (labels, hover, focus) */

  /* Tokens RGB (para rgba con alpha) */
  --bg-rgb: 17, 21, 20;
  --surface-rgb: 25, 31, 29;
  --accent-rgb: 127, 202, 145;
  --accent-bright-rgb: 178, 231, 189;
  --glow-rgb: 69, 118, 80;

  /* Forma y layout */
  --radius: 16px;
  --container: 1160px;

  color-scheme: dark;
}
```

> Regla: para tintes usa siempre `rgba(var(--accent-rgb), α)` / `rgba(var(--accent-bright-rgb), α)`.
> Esto permite reutilizar los mismos componentes con otra paleta cambiando solo las variables.

### 2.2 Tipografía

- Familia: `"Segoe UI Variable", "Aptos", system-ui, sans-serif`.
- Interlineado base: `1.5`.
- Tamaños (clamp / responsive):

| Uso | Tamaño | Peso | letter-spacing |
|---|---|---|---|
| Hero h1 | `clamp(2.6rem, 5.5vw, 4.8rem)` | 750 | -0.04em |
| Sección h3 | `clamp(2rem, 4vw, 3.5rem)` | 700 | -0.04em |
| Título portal | `clamp(1.7rem, 3.5vw, 2.4rem)` | 700 | -0.035em |
| Panel subtitle | `clamp(1.3rem, 2.4vw, 1.8rem)` | 700 | -0.04em |
| Card h4 | `clamp(1.3rem, 2.2vw, 1.7rem)` | 700 | -0.035em |
| Eyebrow (label) | `0.72rem` | 750 | 0.13em (uppercase) |
| Cuerpo | `1rem` / `1.05rem` | 400 | — |
| Nota / muted | `0.85rem` | 500 | — |

### 2.3 Espaciado y radios

- Radios: pill (`999px`) para botones/chips/badges · `16px` (`--radius`) para tarjetas · `10–14px` inputs y bloques internos.
- Padding de tarjetas: `clamp(1.35rem, 3vw, 2rem)`.
- Padding de secciones: `clamp(5rem, 10vw, 8.5rem)`.
- Gaps: `1rem` (grids), `1.25rem` (grids grandes), `2rem` (admin layout).

### 2.4 Fondos y ambiente

- Fondo base `--bg` + dos glows radiales fijos:

```css
body { background: var(--bg); color: var(--ink); font-family: "Segoe UI Variable", "Aptos", system-ui, sans-serif; line-height: 1.5; }

body::before { /* glow principal */
  position: fixed; inset: 0; z-index: -1; content: "";
  background: radial-gradient(circle at 75% 4%, rgba(var(--glow-rgb), 0.17), transparent 26rem);
  pointer-events: none;
}
body::after { /* glows de acento */
  position: fixed; inset: 0; z-index: -2; content: "";
  background:
    radial-gradient(circle at 12% 18%, rgba(var(--accent-rgb), 0.16), transparent 28rem),
    radial-gradient(circle at 88% 68%, rgba(var(--accent-rgb), 0.10), transparent 34rem);
  pointer-events: none;
}
```

---

## 3. Layout

### 3.1 Contenedor y header

```css
.container { width: min(100% - 3rem, var(--container)); margin: 0 auto; }

.site-header {
  position: sticky; top: 0; z-index: 20; height: 68px;
  border-bottom: 1px solid rgba(166, 178, 170, 0.14);
  background: rgba(var(--bg-rgb), 0.9);
  -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
}
.header-inner { display: flex; height: 100%; align-items: center; justify-content: space-between; gap: 1.25rem; }
.header-right { display: flex; align-items: center; gap: 1.25rem; }

.logo { display: inline-flex; align-items: center; gap: 0.55rem; font-size: 1rem; font-weight: 620; }
.logo span { color: var(--accent-bright); font-weight: 800; letter-spacing: 0.1em; }
.logo-mark { width: 30px; height: 30px; object-fit: contain; filter: drop-shadow(0 0 6px rgba(var(--accent-rgb), 0.35)); }
```

Navegación:

```css
.nav { display: flex; gap: 1.4rem; }
.nav a { color: var(--muted); font-size: 0.9rem; font-weight: 600; text-decoration: none; transition: color 180ms ease; }
.nav a:hover { color: var(--accent-bright); }
```

---

## 4. Componentes

### 4.1 Botones

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 46px; padding: 0.72rem 1.2rem;
  border: 1px solid transparent; border-radius: 999px;
  background: var(--accent); color: #102016;
  font: inherit; font-size: 0.92rem; font-weight: 750; line-height: 1; text-decoration: none;
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
}
.btn:hover { background: var(--accent-bright); box-shadow: 0 10px 24px rgba(0,0,0,0.35); transform: translateY(-2px); }
.btn:active { transform: translateY(1px) scale(0.98); }

.btn-ghost { border-color: var(--line); background: transparent; color: var(--ink); }
.btn-ghost:hover { border-color: rgba(var(--accent-bright-rgb), 0.62); background: var(--surface-raised); box-shadow: none; }

.btn-sm { min-height: 38px; padding: 0.5rem 0.9rem; font-size: 0.82rem; }
```

### 4.2 Formularios

```css
.field { display: grid; gap: 0.42rem; }
.field label { color: var(--ink); font-size: 0.88rem; font-weight: 700; }
.field input, .field textarea, .field select {
  width: 100%; min-width: 0; border: 1px solid #46534c; border-radius: 10px;
  background: #101413; color: var(--ink); font: inherit; font-size: 16px;
  line-height: 1.4; padding: 0.72rem 0.82rem;
}
.field input, .field select { min-height: 48px; }
.field input:focus, .field textarea:focus, .field select:focus {
  border-color: var(--accent-bright); outline: 3px solid rgba(var(--accent-rgb), 0.23);
}
.form-status { padding: 0.85rem 1rem; border: 1px solid rgba(var(--accent-bright-rgb), 0.5); border-radius: 10px; background: rgba(var(--accent-rgb), 0.12); color: var(--accent-bright); font-weight: 600; }
```

### 4.3 Tarjetas (glassmorphism)

```css
.layer-card, .contact-form, .stat-card, .calc, .record, .login-card, .modal-card, .solution-card {
  background: linear-gradient(155deg, rgba(var(--accent-rgb), 0.10), rgba(255,255,255,0.02) 62%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  backdrop-filter: blur(18px) saturate(150%);
  box-shadow: 0 6px 14px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.12);
}
.layer-card:hover, .solution-card:hover, .record:hover { border-color: rgba(var(--accent-bright-rgb), 0.5); }
```

### 4.4 Listas de datos (record cards — admin)

```css
.record-list { display: grid; gap: 1rem; margin-top: 1.25rem; }
.record { padding: 1.4rem 1.5rem; }
.record-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.25rem; }
.record-title { font-size: 1.2rem; letter-spacing: -0.02em; }
.record-sub { margin-top: 0.25rem; color: var(--muted); font-size: 0.88rem; }
.record-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.85rem 1.5rem; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--line); }
.record-grid dt { color: var(--muted); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.07em; text-transform: uppercase; }
.record-grid dd { margin-top: 0.2rem; font-weight: 600; }
.record-foot { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--line); }
```

### 4.5 Badges de estado

```css
.status-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border: 1px solid var(--line); border-radius: 999px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
.status-badge.is-ok      { border-color: rgba(var(--accent-rgb), 0.5);        color: var(--accent-bright); background: rgba(var(--accent-rgb), 0.12); }
.status-badge.is-pending { border-color: rgba(242, 208, 107, 0.5);            color: #f2d06b;              background: rgba(242, 208, 107, 0.12); }
```

Estados semánticos (opcionales): éxito `--accent`, alerta `#f2d06b`, riesgo `#f2994a`/`#e25e5e`.

### 4.6 Chips / filtros / tabs

```css
.filter-chip { padding: 0.5rem 0.9rem; border: 1px solid var(--line); border-radius: 999px; background: transparent; color: var(--muted); font: inherit; font-size: 0.82rem; font-weight: 700; }
.filter-chip:hover { border-color: rgba(var(--accent-bright-rgb), 0.5); color: var(--ink); }
.filter-chip.is-active { border-color: var(--accent); background: var(--accent); color: #102016; }

.tabs { display: flex; flex-wrap: wrap; gap: 0.35rem; border-bottom: 1px solid var(--line); }
.tab { padding: 0.75rem 1.1rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted); font-size: 0.9rem; font-weight: 700; }
.tab.is-active { color: var(--accent-bright); border-bottom-color: var(--accent); }
```

### 4.7 Layout de portal / admin

```css
.admin-layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 2rem; align-items: start; }
.admin-sidebar { position: sticky; top: 88px; display: grid; gap: 0.4rem; padding: 1.25rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.admin-nav-btn { padding: 0.7rem 0.9rem; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--muted); font-size: 0.9rem; font-weight: 700; text-align: left; }
.admin-nav-btn:hover { background: var(--surface-raised); color: var(--ink); }
.admin-nav-btn.is-active { border-color: rgba(var(--accent-rgb), 0.5); background: rgba(var(--accent-rgb), 0.12); color: var(--accent-bright); }
```

### 4.8 Dashboard / métricas

```css
.stat-card { padding: 1.5rem; border: 1px solid var(--line); border-radius: var(--radius); background: linear-gradient(155deg, rgba(var(--accent-rgb), 0.12), var(--surface)); }
.stat-label { color: var(--muted); font-size: 0.8rem; font-weight: 700; }
.stat-value { margin-top: 0.5rem; color: var(--accent-bright); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 800; }

.bar { display: grid; grid-template-columns: 150px minmax(0,1fr) 40px; align-items: center; gap: 0.85rem; }
.bar-track { height: 14px; border-radius: 999px; background: #101413; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--accent-bright)); transform-origin: left center; transition: transform 500ms ease; }
```

### 4.9 Modal (detalle / PDF)

```css
.modal { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 1.25rem; background: rgba(0,0,0,0.62); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
.modal-card { width: min(100%, 560px); max-height: 90vh; overflow-y: auto; padding: clamp(1.4rem, 3vw, 2rem); border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: 0 30px 70px rgba(0,0,0,0.55); }
```

### 4.10 Mapa (onboarding)

```css
.ob-map-tools / .ob-map-search { display: flex; gap: 0.6rem; }        /* buscador + botón */
.ob-suggestions { position: absolute; z-index: 20; background: var(--surface-raised); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 18px 40px rgba(0,0,0,0.45); } /* lista de sugerencias */
.ob-map { position: relative; z-index: 0; height: 320px; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.ob-map .leaflet-container { background: #0b0f0d; }
```

### 4.11 Filas dinámicas (orden de llamado / guardias)

```css
.ob-row { display: grid; grid-template-columns: 2.25rem minmax(0,1fr) minmax(0,1fr) auto; gap: 0.6rem; align-items: center; padding: 0.5rem 0.65rem; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,0.02); }
.ob-row-index { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 50%; background: rgba(var(--accent-rgb), 0.16); color: var(--accent-bright); font-weight: 800; }
.ob-row input { min-height: 40px; padding: 0.5rem 0.65rem; border: 1px solid transparent; border-radius: 10px; background: rgba(0,0,0,0.22); color: var(--ink); }
.ob-row-remove { width: 2.1rem; height: 2.1rem; border: 1px solid var(--line); border-radius: 10px; background: transparent; color: var(--muted); }

.ob-add { padding: 0.6rem 1.05rem; border: 1px dashed rgba(var(--accent-rgb), 0.5); border-radius: 12px; background: transparent; color: var(--accent-bright); font-weight: 700; }
.ob-add:hover { background: rgba(var(--accent-rgb), 0.1); border-color: var(--accent); transform: translateY(-1px); }
```

### 4.12 Radios como tarjetas (sí/no)

```css
.ob-options { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0.75rem; }
.ob-option { display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.95rem 1rem; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,0.02); font-weight: 700; cursor: pointer; }
.ob-option::before { content: ""; width: 18px; height: 18px; border: 2px solid var(--line); border-radius: 50%; }
.ob-option.is-selected { border-color: var(--accent); color: var(--accent-bright); background: linear-gradient(150deg, rgba(var(--accent-rgb), 0.18), var(--surface)); }
.ob-option.is-selected::before { border-color: var(--accent); box-shadow: inset 0 0 0 4px var(--accent); }
```

### 4.13 Nota / aviso

```css
.onboarding-note { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 1.05rem; border: 1px solid rgba(242,208,107,0.35); border-left: 3px solid #f2d06b; border-radius: 12px; background: rgba(242,208,107,0.1); color: #f2d06b; font-weight: 700; font-size: 0.9rem; }
```

---

## 5. Animaciones

### 5.1 Intro de carga (overlay)

- Overlay `#intro` fijo, fondo `--bg`, z-index 200.
- El logo entra (fade + subida) y el **wordmark se dibuja** con trazo SVG (`stroke-dasharray/dashoffset`), luego aparece el relleno.
- Al terminar (~2.35 s) la cortina se desvanece (600 ms) y se libera el scroll.
- Se puede saltar con click/tecla/scroll/toque. Respeta `prefers-reduced-motion` (se omite).

```css
.intro { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; background: var(--bg); animation: intro-out 600ms ease 2350ms forwards; }
.intro-word-stroke { fill: none; stroke: var(--accent-bright); stroke-width: 1.8; stroke-linecap: round; animation: intro-draw 1200ms cubic-bezier(0.65,0,0.35,1) 320ms forwards; }
.intro-word-fill { fill: var(--ink); opacity: 0; animation: intro-fill 520ms ease 1280ms forwards; }
@keyframes intro-draw { to { stroke-dashoffset: 0; } }
@keyframes intro-fill { to { opacity: 1; } }
@keyframes intro-out  { to { opacity: 0; visibility: hidden; } }
```

### 5.2 Reveal por scroll

```css
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 560ms cubic-bezier(0.16,1,0.3,1), transform 560ms cubic-bezier(0.16,1,0.3,1); }
.reveal.is-visible { opacity: 1; transform: translateY(0); }
```

Aplicar con `IntersectionObserver` (`threshold: 0.16`) a secciones, tarjetas y pasos, con delays escalonados (70–220 ms).

### 5.3 Entrada del hero

```css
@keyframes hero-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.hero-copy { animation: hero-in 650ms cubic-bezier(0.16,1,0.3,1) both; }
.hero-asset { animation: hero-in 800ms cubic-bezier(0.16,1,0.3,1) 120ms both; }
```

### 5.4 Micro-interacciones

- Botones: `translateY(-2px)` + sombra en hover; `scale(0.98)` en active.
- Tarjetas: `translateY(-4px)` + borde acento en hover.
- Inputs: borde `--accent-bright` + `outline: 3px solid rgba(accent,0.23)` en focus.

### 5.5 Efecto "matrix" (opcional, tarjetas)

Canvas de fondo en `.layer-card` con lluvia de caracteres verdes; aparece con fade + `scale(1.1 → 1)` en hover. Color toma `--accent-rgb` / `--accent-bright-rgb`. Corre solo cuando el cursor está encima y respeta `prefers-reduced-motion`.

### 5.6 Accesibilidad de movimiento

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 6. Responsive

| Breakpoint | Cambios clave |
|---|---|
| **≤ 960px** | Aparece menú hamburguesa (`.nav-toggle`); nav desplegable vertical; admin layout a 1 columna; sidebar horizontal. |
| **≤ 760px** | `.container` a `100% - 2rem`; hero/grids a 1 columna; tablas → tarjetas (`data-label`); formularios y botones al 100%; filas dinámicas se reordenan (nombre/ teléfono en 2 líneas). |
| **≤ 480px** | Logo más chico; tipografías menores; `.range-fields` a 1 columna. |

```css
@media (max-width: 960px) {
  .nav-toggle { display: flex; }
  .admin-layout { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .container { width: min(100% - 2rem, var(--container)); }
  .hero-content, .split, .contact, .layer-grid, .solution-grid { grid-template-columns: 1fr; }
  .contact-form .btn { width: 100%; }
}
```

Soporte iOS (safe-area):

```css
@supports (padding: max(0px)) {
  .container { padding-left: max(0px, env(safe-area-inset-left)); padding-right: max(0px, env(safe-area-inset-right)); }
  .site-footer { padding-bottom: max(0px, env(safe-area-inset-bottom)); }
}
```

---

## 7. Accesibilidad

- Foco visible: `outline: 3px solid var(--accent-bright); outline-offset: 2-3px;`.
- Skip link al contenido.
- `touch-action: manipulation` en botones/chips/tabs.
- `font-variant-numeric: tabular-nums` en cifras (sueldos, tablas, métricas).
- Contraste: texto `--ink` sobre `--bg`/`--surface`; `--muted` para secundario.
- Estados `[hidden] { display: none !important; }`.

---

## 8. Estructura del portal (flujos)

### 8.1 Vistas

1. **login-view**: usuario + contraseña. Admin por defecto (`admin`/`admin123`) o cuentas creadas.
2. **panel-view** (admin): sidebar + secciones.
3. **client-view** (portal cliente): tabs (Solicitar grabación / Aumento de cámaras / Actualización de datos).
4. **onboarding-view**: primer ingreso obligatorio del cliente.

### 8.2 Secciones del admin

Inicio · Clientes potenciales · Solicitudes de clientes · Cuentas del cliente · Roles · Precios por cámaras · Cálculo mensual · Sueldos.

### 8.3 Roles (RBAC)

- Cada rol define qué secciones de admin ve + permiso de **Portal cliente**.
- Se asignan a las cuentas en "Cuentas del cliente".
- Al iniciar sesión, el panel muestra solo las secciones permitidas por el rol.
- Roles sugeridos: **Administrador** (todo) y **Cliente** (solo portal).

### 8.4 Cuentas del cliente

- Se crean para solicitudes en estado **"Ya atendido"**.
- Campos: **Usuario** (por defecto = correo del cliente), **Contraseña** (por defecto = últimos 4 dígitos del RUT antes del guion), **Rol**.
- Badges: "Datos completados/pendientes" y "Monitoreo habilitado/No iniciado".

### 8.5 Onboarding (primer ingreso, obligatorio)

El cliente no accede al portal hasta completar:

1. **Nombre de la instalación**.
2. **¿Contiene guardia?** (Sí / No).
3. Si **Sí**:
   - **Guardias**: nombre + teléfono (al menos uno).
   - **Supervisor**: nombre + teléfono.
4. **Orden de llamado en caso de intrusión**: mínimo el 1° (nombre + teléfono); botón para agregar más.
5. **Direcciones de ingreso**: una o más; botón para agregar. Cada una marcable en el **mapa** (buscar + pin arrastrable) con **geocodificación inversa** que autocompleta la dirección.

Aviso visible: *"Si no completas estos datos, el monitoreo no podrá iniciarse."*
El estado "Monitoreo habilitado" del admin solo se activa con todos los datos anteriores completos.

---

## 9. Estructura de datos (persistencia de referencia)

Implementado con `localStorage` (clave → contenido):

| Clave | Contenido |
|---|---|
| `neo_solicitudes` | Clientes potenciales (empresa, RUT, correo, teléfono, cámaras, solución, estado). |
| `neo_solicitudes_cliente` | Solicitudes de clientes (grabación / cámaras). |
| `neo_cuentas_cliente` | Cuentas (usuario, contraseña, rol, datos de onboarding, direcciones, mapa). |
| `neo_roles` | Roles y permisos por sección. |
| `neo_datos_instalacion` | Datos de instalación (clásico). |
| `neo_precios`, `neo_implementacion`, `neo_sueldos`, `neo_sueldo_params`, `neo_horario`, `neo_uf` | Configuración del panel. |

> En un backend real, reemplazar por API + autenticación y hashing de contraseñas.

---

## 10. Notas de implementación

- Fuente: usar `system-ui` o una fuente sans geométrica similar (Inter, Manrope) si no hay Segoe UI.
- Iconografía: SVG de línea (stroke ~1.6–2), sin relleno, tamaño 20–34 px.
- Imágenes/logo: PNG con transparencia o SVG; `border-radius` + sombras suaves.
- Mantener los tokens como CSS variables para permitir cambiar de tema (p. ej. otro color de acento) sin tocar componentes.
