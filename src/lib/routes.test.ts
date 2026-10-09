import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyPublicPath, matchPublicPath, publicPage, routeInfo, siteURL } from './routes';
test('public routes preserve commercial links', () => {
  assert.equal(legacyPublicPath('#contacto'), '/contacto');
  assert.equal(legacyPublicPath('#tigrr'), '/neo');
  assert.equal(legacyPublicPath('#soluciones'), null);
  assert.equal(legacyPublicPath('#proceso'), null);
  assert.equal(publicPage('/neo'), 'neo');
  assert.equal(publicPage('/preview/5178/central-24-7', '/preview/5178/'), 'central');
  assert.equal(publicPage('/'), 'home');
  assert.equal(siteURL('/contacto'), '/contacto');
});
test('client navigation only matches known public routes', () => {
  assert.equal(matchPublicPath('/central-24-7/'), 'central');
  assert.equal(matchPublicPath('/soluciones'), null);
  assert.equal(matchPublicPath('/'), 'home');
  assert.equal(matchPublicPath('/api/leads'), null);
  assert.equal(matchPublicPath('/tigrr.png'), null);
  assert.equal(matchPublicPath('/otro/neo', '/preview/'), null);
  assert.equal(routeInfo('neo').path, '/neo');
});
