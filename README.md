# Tigrr Security · Web pública

Sitio comercial React/TypeScript/Vite con las páginas `/`, `/soluciones`, `/neo`, `/central-24-7` y `/contacto`. Producción: https://tigrrsecurity.cl y https://www.tigrrsecurity.cl.

El panel interno se extrajo al repositorio privado `KalciferTolueno/tigrr-administrativo`, con imagen y servicio independientes en https://administrativo.tigrrsecurity.cl. Este proyecto ya no contiene entradas, componentes, rutas, sesiones, usuarios, directorio ni backend administrativo. Las URLs antiguas no tienen ruta ni fallback: devuelven 404, igual que cualquier página inexistente.

```sh
npm ci
npm run build
npm test
node --env-file=.env server.js
npm run dev
```

El build prerenderiza las páginas comerciales. Sólo se publica `dist/`; no se sirven fuentes ni configuración. HTML revalida por ETag, los assets versionados tienen caché immutable y la API usa no-store.

## Formulario comercial

El único endpoint es `POST /api/leads`: valida origen, tamaño, campos y frecuencia; envía la solicitud por la red privada al receptor configurado en `LEAD_SERVICE_URL`. `LEAD_SERVICE_TOKEN` sólo permite esa entrega; no autoriza lecturas, usuarios ni sesiones. No se entrega al navegador ni se guarda en la imagen.

Este servicio no tiene dependencia `pg`, conexión PostgreSQL, `DATABASE_URL` ni credenciales Core. No confirma una solicitud si el receptor falla. Los datos administrativos existentes siguen en su base original, atendida exclusivamente por el servicio interno.

Entorno: `PORT`, `PUBLIC_URL`, `PUBLIC_ALLOWED_ORIGINS`, `LEAD_SERVICE_URL`, `LEAD_SERVICE_TOKEN`. La web pública y el panel se construyen y despliegan por separado.

Vista previa integrada: `PREVIEW_BASE=/preview/5180/`, servidor Vite en `:5180`; el build productivo utiliza `/`.
