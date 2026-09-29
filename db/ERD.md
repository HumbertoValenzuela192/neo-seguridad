# NEO · Modelo de base de datos (ERD)

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : "rol_id"
    CLIENTES ||--o| CLIENTE_USUARIOS : "tiene"
    USUARIOS ||--o| CLIENTE_USUARIOS : "cuenta"
    CLIENTES ||--o{ INSTALACIONES : "posee"
    INSTALACIONES ||--o| DATOS_INSTALACIONES : "detalle"
    INSTALACIONES ||--o{ DIRECCIONES_INGRESO : "direcciones"
    INSTALACIONES ||--o{ ORDEN_LLAMADO : "orden"
    INSTALACIONES ||--o{ GUARDIAS : "guardias"
    CLIENTES ||--o{ SOLICITUDES_CLIENTE : "solicita"
    TRABAJADORES ||--o| DATOS_TRABAJADOR : "detalle"

    ROLES {
        int id PK
        string nombre
        json secciones
        bool portal_cliente
        bool es_sistema
    }
    USUARIOS {
        bigint id PK
        string usuario
        string nombre
        text password_hash
        int rol_id FK
        bool activo
    }
    CLIENTES {
        bigint id PK
        string nombre
        string rut
        string email
        string telefono
    }
    CLIENTE_USUARIOS {
        bigint id PK
        bigint cliente_id FK
        bigint usuario_id FK
    }
    INSTALACIONES {
        bigint id PK
        bigint cliente_id FK
        string nombre
    }
    DATOS_INSTALACIONES {
        bigint id PK
        bigint instalacion_id FK
        bool contiene_guardia
        string supervisor_nombre
        string supervisor_telefono
        bool onboarding_completo
        bool monitor_habilitado
    }
    DIRECCIONES_INGRESO {
        bigint id PK
        bigint instalacion_id FK
        string direccion
        numeric latitud
        numeric longitud
    }
    ORDEN_LLAMADO {
        bigint id PK
        bigint instalacion_id FK
        smallint orden
        string nombre
        string telefono
    }
    GUARDIAS {
        bigint id PK
        bigint instalacion_id FK
        string nombre
        string telefono
    }
    SOLICITUDES {
        bigint id PK
        string empresa
        string rut
        string email
        string estado
    }
    SOLICITUDES_CLIENTE {
        bigint id PK
        bigint cliente_id FK
        string tipo
        string estado
    }
    TRABAJADORES {
        bigint id PK
        string nombre
        string rut
    }
    DATOS_TRABAJADOR {
        bigint id PK
        bigint trabajador_id FK
        string email
        string telefono
    }
    DATOS_PRECIOS {
        bigint id PK
        string tramo
        numeric precio
        string tipo
    }
```

## Relaciones

- **roles 1—N usuarios**: cada usuario tiene un rol que define las secciones que puede ver.
- **clientes 1—1 usuarios** (vía `cliente_usuarios`): la cuenta de acceso del cliente.
- **clientes 1—N instalaciones**: un cliente puede tener varias instalaciones.
- **instalaciones 1—1 datos_instalaciones**: datos de onboarding (guardia, supervisor, estado).
- **instalaciones 1—N direcciones_ingreso / orden_llamado / guardias**.
- **clientes 1—N solicitudes_cliente**.
- **trabajadores 1—1 datos_trabajador**.
- **datos_precios**: tramos de precios (cámaras / implementación).

## Seed

- Rol **Administrador** (`id=1`) con todas las secciones.
- Rol **Cliente** (`id=2`) solo portal.
- Usuario **admin** / contraseña **admin** (hash `salt:sha256`), rol Administrador.

> El esquema está en `db/neo-schema.sql` (PostgreSQL).
