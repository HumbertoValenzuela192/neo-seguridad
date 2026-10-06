# Portal y directorio NEO

## Estado

Implementado sobre `neov01`, base `97ac9e8`. El backend se despliega después del Core con su API de directorio y configuración de token/tenant.

## Datos que se conservan

No se elimina la tabla `store`. Las cuentas, hashes existentes, solicitudes y configuración permanecen en PostgreSQL. El login se valida ahora en servidor y emite una cookie de sesión HttpOnly; las contraseñas nuevas usan scrypt. Los hashes SHA-256 heredados se verifican y se actualizan al iniciar sesión cuando la longitud permite el formato nuevo.

En v2.1, `src/lib/recovery.ts` preserva una copia local antes de cargar los datos del servidor. En el primer ingreso de un administrador la archiva automáticamente mediante `/api/recovery` y dispara la importación idempotente al Core. Sólo entonces carga los datos compartidos. Conserva también el respaldo local. `/admin/recuperacion` ofrece exportación/importación manual como recuperación adicional; no es necesaria para el flujo automático. Los archivos contienen información privada y no deben versionarse.

## Configuración

| Variable | Uso |
|---|---|
| DATABASE_URL | Base actual del portal |
| PORTAL_PUBLIC_URL | Origen HTTPS principal, valida solicitudes y activa cookie Secure |
| PORTAL_ALLOWED_ORIGINS | Alias explícitos separados por coma, por ejemplo el origen con www |
| PORTAL_BOOTSTRAP_PASSWORD | Sólo para una instalación vacía; no reemplaza usuarios existentes |
| CORE_URL | URL del Core, sin `/api/v1` |
| CORE_CLIENT_DIRECTORY_TOKEN | Mismo secreto configurado en Core; nunca se envía al navegador |

CORE_URL y CORE_CLIENT_DIRECTORY_TOKEN se definen juntos. El Core pasa a ser la fuente de verdad de las fichas; las cuentas del portal mantienen sus credenciales y referencia a instalaciones. Al iniciar, el servidor importa las cuentas que ya existen en PostgreSQL; si el Core no está disponible reintenta al ingresar un administrador.

## Uso

1. Preservar las bases con un dump verificable. La copia de navegador se preserva e importa automáticamente al ingresar como administrador.
2. Respaldar PostgreSQL. Desplegar primero Core y configurar su tenant/token.
3. Desplegar este portal con DATABASE_URL existente y origen HTTPS. Iniciar sesión con una cuenta actual.
4. Entrar como administrador en el mismo navegador/origen donde se hicieron las pruebas. La recuperación archiva el documento original y añade registros ausentes sin sobrescribir los existentes.
5. La importación automática genera una referencia `portal:<cuenta>:<instalación>` por instalación, independiente del nombre, organización y posición. `/admin/clientes` permite repetirla manualmente si hace falta.
6. Verificar cantidades y datos; repetir importación no duplica ni sobrescribe.
7. Administrar fichas y organizaciones en el directorio compartido. El formulario cliente existente también proyecta/actualiza su ficha en Core. Cambiar datos no altera cámaras, permisos ni WhatsApp.

No se elimina una ficha de NEO al borrar su cuenta del portal. La cuenta de acceso y la ficha operativa son entidades distintas. El endpoint genérico antiguo de borrado de claves dejó de estar disponible.

Las escrituras comerciales siguen guardándose en `store`, con comprobación de versión para evitar sustituir listas antiguas. El backend filtra por sección y, para clientes finales, por cuenta propia. La web pública sólo puede añadir una solicitud comercial validada; no leer ni sustituir las listas.

## Pruebas

`npm install --ignore-scripts` y `npm test`, con `TEST_DATABASE_URL` apuntando a PostgreSQL desechable. Los tests usan un schema temporal y lo eliminan al terminar. Cubren login/herencia de hashes, scripts, sesión, autorización, recuperación sin sobrescritura, referencias estables, importación repetida, protección de otra cuenta y conflictos.
