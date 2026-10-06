# Tigrr Security / NEO · v2.1

Web comercial y portal en React, TypeScript, Vite y Tailwind CSS v4. El backend Node.js/PostgreSQL mantiene la API, cuentas, sesiones HttpOnly, versiones y puente de directorio existentes.

## Desarrollo

Requiere Node.js 22.12+ y la base del portal.

```sh
npm ci
# Configurar las variables de .env.example en el proceso del backend.
node --env-file=.env server.js
npm run dev
```

Vite escucha en `:5173` y envía `/api` a `http://127.0.0.1:3000`. Para escribir desde Vite, agregar su origen a `PORTAL_ALLOWED_ORIGINS`. `PORTAL_API_URL` permite cambiar el backend local. No apuntar pruebas de escritura a producción.

Entradas conservadas:

- `/` y `/index.html`: web comercial Tigrr.
- `/tigrr.html`: presentación NEO.
- `/admin.html`: login, administración y solicitudes del cliente.
- `/directory.html`: directorio compartido (requiere permiso `cuentas`).
- `/recover.html`: respaldo del navegador; exportar no exige sesión.

El portal usa rutas hash (`admin.html#/cuentas`) para conservar URLs, recargas y navegación sin cambios de proxy. Cada módulo se carga bajo demanda. La web comercial y NEO se prerenderizan en el build y tienen su propia entrada.

## Compilación y producción

```sh
npm run build
npm start
```

`build` comprueba TypeScript, genera `dist/` y prerenderiza ambas páginas públicas. El servidor sólo publica `dist/`, nunca `src/`, configuración ni archivos del backend. HTML e imágenes de marca revalidan por ETag; chunks versionados tienen caché immutable. API mantiene `no-store`.

El Dockerfile compila en una etapa separada y conserva Node.js, PostgreSQL externo y puerto `3000`. Las variables existentes no cambian; los secretos sólo se leen en runtime.

## Datos y transición

- Se conserva la tabla `store`, sus claves `neo_*`, IDs y campos heredados. No hay migración destructiva de base.
- `src/lib/recovery.ts` preserva la copia local y la archiva antes de cargar datos canónicos, como en la versión anterior. No modifica los métodos de `localStorage`.
- Las escrituras usan directamente la API y su versión. Un error o 409 conserva el borrador del formulario.
- Después de editar instalaciones se recarga la proyección y `coreVersion` antes del siguiente guardado.
- Se conservan cotización por UF, implementación pagada/pendiente, descuento promocional, impresión de liquidaciones, agenda día/semana/mes, lectura de resumen, mapas y solicitudes de grabación/cámaras.
- La calculadora de precios agrega a la tabla el **precio por cámara**, corrigiendo el uso anterior del total para ese campo. Las remuneraciones conservan tasas, parámetros y fórmulas; su configuración no se actualiza silenciosamente.
- El video comercial anterior era un placeholder sin contenido. La página conserva el contenido real y no presenta un reproductor vacío.

## Pruebas

```sh
npm run build
# TEST_DATABASE_URL: PostgreSQL desechable, nunca la base productiva.
npm test
npm audit --audit-level=high
```

Las pruebas del servidor crean un schema temporal y cubren autorización, credenciales heredadas, recuperación, conflictos, aislamiento y servido de assets. Las pruebas TypeScript cubren remuneraciones, decimales, RUT, tramos y recuperación asíncrona sin sobrescribir datos locales.

`scripts/lab-server.cjs` es un laboratorio opcional: exige `TEST_DATABASE_URL` y `LAB_PASSWORD`, crea otro schema, usa fixtures explícitas y simula únicamente el directorio Core. Escucha en `:3101` y elimina su schema al recibir SIGINT/SIGTERM.

Vista previa integrada: `PREVIEW_BASE=/preview/5176/`, `PORTAL_API_URL=http://127.0.0.1:3101`, Vite en `:5176`. El build productivo usa base `/`. Detener los procesos locales y eliminar el contenedor desechable al terminar de revisar.

## Organización

`src/public/`: contenido comercial y efectos WebGL/Canvas.
`src/portal/`: sesión, navegación y módulos de gestión.
`src/components/`: controles accesibles, marca, contactos y ubicación.
`src/lib/`: API, cálculos y compatibilidad de datos.
`src/styles/index.css`: tokens Tigrr/NEO y Tailwind.

Ver `DESIGN.md` y `CLIENT-DIRECTORY.md`. Los cambios v2.1 se trabajan en la rama `v2.1`, basada en `neov01`; publicar esa rama no cambia por sí mismo la rama que despliega producción.
