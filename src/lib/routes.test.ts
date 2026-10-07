import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyPublicPath, publicPage, siteURL } from './routes';
test('public routes preserve commercial links', () => {
  assert.equal(legacyPublicPath('#contacto'), '/contacto');
  assert.equal(legacyPublicPath('#tigrr'), '/neo');
  assert.equal(legacyPublicPath('#proceso'), null);
  assert.equal(publicPage('/neo'), 'neo');
  assert.equal(publicPage('/preview/5178/central-24-7', '/preview/5178/'), 'central');
  assert.equal(publicPage('/'), 'home');
  assert.equal(siteURL('/contacto'), '/contacto');
});
