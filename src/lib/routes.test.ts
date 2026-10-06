import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyPortalPath, legacyPublicPath, publicPage, sectionPath, siteURL } from './routes';

test('clean routes preserve legacy permission keys and resolve old hash links', () => {
  assert.equal(sectionPath('solicitudes'), '/clientes-potenciales');
  assert.equal(sectionPath('clientes'), '/solicitudes');
  assert.equal(legacyPortalPath('#/clientes'), '/solicitudes');
  assert.equal(
    legacyPortalPath('#/solicitudes?estado=nuevo'),
    '/clientes-potenciales?estado=nuevo',
  );
  assert.equal(legacyPortalPath('#/directorio'), '/clientes');
  assert.equal(legacyPortalPath('#/cliente'), '/portal-cliente');
  assert.equal(legacyPortalPath('#/sueldo'), '/sueldos');
  assert.equal(legacyPortalPath('#/recuperacion'), '/recuperacion');
  assert.equal(legacyPortalPath('#/'), '/');
  assert.equal(legacyPortalPath('#portal-main'), null);
  assert.equal(legacyPortalPath('#//evil.invalid'), '/');
  assert.equal(legacyPortalPath('#/constructor'), '/');
  assert.equal(legacyPublicPath('#contacto'), '/contacto');
  assert.equal(legacyPublicPath('#tigrr'), '/neo');
  assert.equal(legacyPublicPath('#proceso'), null);
  assert.equal(publicPage('/neo'), 'neo');
  assert.equal(publicPage('/preview/5176/central-24-7', '/preview/5176/'), 'central');
  assert.equal(publicPage('/'), 'home');
  assert.equal(siteURL('/admin/cuentas'), '/admin/cuentas');
});
