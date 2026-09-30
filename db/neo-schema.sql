-- =============================================================
--  NEO Seguridad · Software de Monitoreo
--  Esquema de base de datos (PostgreSQL)
--  Basado en el modelo: trabajadores, datos_trabajador, datos_precios,
--  usuario, cliente, instalaciones, datos_instalaciones, roles
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- ROLES  (permisos por sección del panel + portal cliente)
-- -------------------------------------------------------------
CREATE TABLE roles (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(80) NOT NULL UNIQUE,
  descripcion     TEXT,
  -- lista de secciones permitidas: inicio, solicitudes, clientes,
  -- cuentas, roles, usuarios, precios, mensual, sueldo
  secciones       JSONB NOT NULL DEFAULT '[]'::jsonb,
  portal_cliente  BOOLEAN NOT NULL DEFAULT FALSE,
  es_sistema      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- USUARIOS  (acceso al panel / portal)
-- Contraseñas CIFRADAS (hash), nunca en texto plano.
-- -------------------------------------------------------------
CREATE TABLE usuarios (
  id             BIGSERIAL PRIMARY KEY,
  usuario        VARCHAR(160) NOT NULL UNIQUE,   -- puede ser el correo
  nombre         VARCHAR(160),
  password_hash  TEXT NOT NULL,                  -- formato salt:hash
  rol_id         INTEGER NOT NULL REFERENCES roles(id),
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);

-- -------------------------------------------------------------
-- CLIENTE
-- -------------------------------------------------------------
CREATE TABLE clientes (
  id           BIGSERIAL PRIMARY KEY,
  nombre       VARCHAR(200) NOT NULL,
  rut          VARCHAR(20),
  email        VARCHAR(200),
  telefono     VARCHAR(40),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cuenta de acceso del cliente (1:1 con cliente)
CREATE TABLE cliente_usuarios (
  id            BIGSERIAL PRIMARY KEY,
  cliente_id    BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  usuario_id    BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id)
);

-- -------------------------------------------------------------
-- INSTALACIONES
-- -------------------------------------------------------------
CREATE TABLE instalaciones (
  id           BIGSERIAL PRIMARY KEY,
  cliente_id   BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre       VARCHAR(200) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_instalaciones_cliente ON instalaciones(cliente_id);

-- -------------------------------------------------------------
-- DATOS_INSTALACIONES  (onboarding: guardia, supervisor, etc.)
-- -------------------------------------------------------------
CREATE TABLE datos_instalaciones (
  id                     BIGSERIAL PRIMARY KEY,
  instalacion_id         BIGINT NOT NULL REFERENCES instalaciones(id) ON DELETE CASCADE,
  contiene_guardia       BOOLEAN NOT NULL DEFAULT FALSE,
  supervisor_nombre      VARCHAR(160),
  supervisor_telefono    VARCHAR(40),
  onboarding_completo    BOOLEAN NOT NULL DEFAULT FALSE,
  monitor_habilitado     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instalacion_id)
);

-- Direcciones de ingreso de una instalación
CREATE TABLE direcciones_ingreso (
  id              BIGSERIAL PRIMARY KEY,
  instalacion_id  BIGINT NOT NULL REFERENCES instalaciones(id) ON DELETE CASCADE,
  direccion       VARCHAR(300) NOT NULL,
  latitud         NUMERIC(10, 6),
  longitud        NUMERIC(10, 6)
);
CREATE INDEX idx_direcciones_instalacion ON direcciones_ingreso(instalacion_id);

-- Orden de llamado en caso de intrusión (1°, 2°, 3°, ...)
CREATE TABLE orden_llamado (
  id              BIGSERIAL PRIMARY KEY,
  instalacion_id  BIGINT NOT NULL REFERENCES instalaciones(id) ON DELETE CASCADE,
  orden           SMALLINT NOT NULL,
  cargo           VARCHAR(120),
  nombre          VARCHAR(160) NOT NULL,
  telefono        VARCHAR(40) NOT NULL,
  UNIQUE (instalacion_id, orden)
);

-- Guardias de la instalación
CREATE TABLE guardias (
  id              BIGSERIAL PRIMARY KEY,
  instalacion_id  BIGINT NOT NULL REFERENCES instalaciones(id) ON DELETE CASCADE,
  nombre          VARCHAR(160) NOT NULL,
  telefono        VARCHAR(40)
);
CREATE INDEX idx_guardias_instalacion ON guardias(instalacion_id);

-- -------------------------------------------------------------
-- SOLICITUDES (clientes potenciales) y solicitudes de clientes
-- -------------------------------------------------------------
CREATE TABLE solicitudes (
  id          BIGSERIAL PRIMARY KEY,
  empresa     VARCHAR(200),
  rut         VARCHAR(20),
  gerente     VARCHAR(160),
  email       VARCHAR(200),
  telefono    VARCHAR(40),
  camaras     INTEGER,
  operadores  INTEGER,
  solucion    VARCHAR(80),
  estado      VARCHAR(20) NOT NULL DEFAULT 'nuevo',  -- nuevo | proceso | atendido
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE solicitudes_cliente (
  id          BIGSERIAL PRIMARY KEY,
  cliente_id  BIGINT REFERENCES clientes(id) ON DELETE SET NULL,
  tipo        VARCHAR(20) NOT NULL,   -- grabacion | camaras
  desde       TIMESTAMPTZ,
  hasta       TIMESTAMPTZ,
  detalle     TEXT,
  estado      VARCHAR(20) NOT NULL DEFAULT 'nuevo',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- TRABAJADORES
-- -------------------------------------------------------------
CREATE TABLE trabajadores (
  id           BIGSERIAL PRIMARY KEY,
  nombre       VARCHAR(200) NOT NULL,
  rut          VARCHAR(20) UNIQUE,
  cargo        VARCHAR(120),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE datos_trabajador (
  id              BIGSERIAL PRIMARY KEY,
  trabajador_id   BIGINT NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
  email           VARCHAR(200),
  telefono        VARCHAR(40),
  direccion       VARCHAR(300),
  fecha_ingreso   DATE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trabajador_id)
);

-- -------------------------------------------------------------
-- DATOS DE PRECIOS
-- -------------------------------------------------------------
CREATE TABLE datos_precios (
  id          BIGSERIAL PRIMARY KEY,
  tramo       VARCHAR(80) NOT NULL,   -- "1 a 10", "11 a 30", ...
  precio      NUMERIC(12, 2),
  tipo        VARCHAR(20) NOT NULL DEFAULT 'camaras',  -- camaras | implementacion
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- SEED: roles y usuario admin (usuario: admin / contraseña: admin)
-- El hash corresponde a SHA-256(salt + "admin") en formato salt:hash.
-- =============================================================
INSERT INTO roles (id, nombre, descripcion, secciones, portal_cliente, es_sistema) VALUES
  (1, 'Administrador', 'Acceso total', '["inicio","solicitudes","clientes","cuentas","roles","usuarios","precios","mensual","sueldo"]'::jsonb, FALSE, TRUE),
  (2, 'Cliente', 'Solo portal cliente', '[]'::jsonb, TRUE, TRUE);
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

INSERT INTO usuarios (usuario, nombre, password_hash, rol_id, activo) VALUES
  ('admin', 'Administrador', 'b3a8604e3465c8b4ff0ceb44a855aeb8:4d9d5f4ea0e7bef2451b0c28fc45de4a674a6c4c562738ebde02571a3f682124', 1, TRUE);
