// Isolated local QA server. Uses a fresh schema; never connect to the production database.
const { Pool } = require('pg');
const crypto = require('node:crypto');
const { createPortalServer, initialize, hashPassword } = require('../portal-server');
async function main() {
  if (!process.env.TEST_DATABASE_URL || !process.env.LAB_PASSWORD)
    throw new Error('TEST_DATABASE_URL y LAB_PASSWORD requeridas.');
  const schema = 'lab_' + crypto.randomBytes(6).toString('hex'),
    admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.query('CREATE SCHEMA ' + schema);
  const db = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    options: '-c search_path=' + schema,
  });
  await initialize(db, process.env.LAB_PASSWORD);
  const clients = [],
    organizations = [];
  const fetchCore = async (url, options) => {
    const path = new URL(url).pathname.split('/client-directory')[1],
      body = options.body ? JSON.parse(options.body) : {};
    let data,
      status = 200;
    if (options.method === 'GET' && path === '/clients') data = { clients };
    else if (options.method === 'GET' && path === '/organizations') data = { organizations };
    else if (options.method === 'POST' && path === '/clients') {
      data = clients.find((c) => body.external_id && c.external_id === body.external_id);
      if (!data) {
        data = {
          id: crypto.randomUUID(),
          code: 'C' + (clients.length + 1),
          organization_id: null,
          contacts: [],
          guards: [],
          addresses: [],
          supervisor: { name: '', phone: '', relationship: '', email: '' },
          ...body,
          version: 1,
        };
        clients.push(data);
      }
    } else if (options.method === 'PATCH' && path.startsWith('/clients/')) {
      data = clients.find((c) => path === '/clients/' + c.id);
      if (!data) {
        status = 404;
        data = { error: { message: 'No existe la ficha.' } };
      } else if (data.version !== body.version) {
        status = 409;
        data = { error: { message: 'La ficha cambió. Actualiza antes de guardar.' } };
      } else Object.assign(data, body, { version: data.version + 1 });
    } else if (options.method === 'POST' && path === '/organizations') {
      data = { id: crypto.randomUUID(), name: body.name };
      organizations.push(data);
    } else if (path.startsWith('/organizations/')) {
      const index = organizations.findIndex((o) => path === '/organizations/' + o.id);
      if (index < 0) {
        status = 404;
        data = { error: { message: 'No existe la organización.' } };
      } else if (options.method === 'PUT') {
        data = organizations[index];
        data.name = body.name;
      } else if (options.method === 'DELETE') {
        const removed = organizations.splice(index, 1)[0];
        clients.forEach((c) => {
          if (c.organization_id === removed.id) c.organization_id = null;
        });
        data = { ok: true };
      }
    } else {
      status = 404;
      data = { error: { message: 'Ruta no encontrada.' } };
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const pwd = await hashPassword(process.env.LAB_PASSWORD);
  const fixtures = {
    neo_roles: [
      {
        id: 'admin',
        name: 'Administrador',
        sections: [
          'inicio',
          'solicitudes',
          'clientes',
          'cuentas',
          'usuarios',
          'roles',
          'precios',
          'mensual',
          'sueldo',
        ],
        portal: false,
      },
      { id: 'cliente', name: 'Cliente', sections: [], portal: true },
    ],
    neo_solicitudes: [
      {
        id: 'lab-lead',
        date: '06-10-2026 10:00',
        company: 'Empresa de prueba',
        rut: '12.345.678-5',
        manager: 'Contacto de prueba',
        email: 'fixture@example.test',
        phone: '56911111111',
        cameras: '16',
        operators: '2',
        solution: 'Monitoreo 24/7',
        status: 'proceso',
      },
    ],
    neo_cuentas_cliente: [
      {
        id: 'lab-client',
        name: 'Cliente de prueba',
        user: 'client',
        pass: pwd,
        role: 'cliente',
        installations: [
          {
            id: 'lab-installation',
            name: 'Instalación de prueba',
            addresses: [{ address: 'Santiago, Chile', lat: -33.4489, lng: -70.6693 }],
            hasGuard: 'no',
            callOrder: [
              {
                name: 'Contacto de prueba',
                cargo: 'Administrador',
                phone: '56911111111',
                email: 'fixture@example.test',
              },
            ],
            guards: [],
            supervisorName: '',
            supervisorPhone: '',
            onboarded: true,
          },
        ],
      },
    ],
  };
  for (const [key, value] of Object.entries(fixtures))
    await db.query(
      'INSERT INTO store(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
      [key, JSON.stringify(value)],
    );
  const server = createPortalServer({
    db,
    coreURL: 'https://fixture.invalid',
    coreToken: 'local-fixture',
    fetchCore,
    allowedOrigins: [
      'http://localhost:5176',
      'http://127.0.0.1:5176',
      'http://localhost:3101',
      'http://127.0.0.1:3101',
    ],
  });
  await server.importDirectory();
  server.listen(3101, '0.0.0.0', () => console.log('QA backend :3101; schema ' + schema));
  const close = async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.end();
    await admin.query('DROP SCHEMA ' + schema + ' CASCADE');
    await admin.end();
    process.exit();
  };
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
