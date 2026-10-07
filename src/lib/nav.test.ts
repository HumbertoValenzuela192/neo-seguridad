import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NAV, canSee, homePathFor, navForPath, navPath } from '../portal/nav';
import type { Session } from '../types';
test('shared navigation preserves independent permissions, routes and mobile shortcuts', () => {
  const base: Session = {
    kind: 'user',
    id: 'fixture',
    name: 'Fixture',
    sections: [],
    portal: false,
  };
  const access = NAV.find((item) => item.to === '/usuarios')!;
  const roles = { ...base, sections: ['roles'] } as Session;
  assert.equal(canSee(access, roles), true);
  assert.equal(navPath(access, roles), '/roles');
  assert.equal(homePathFor(roles), '/roles');
  const users = { ...base, sections: ['usuarios'] } as Session;
  assert.equal(navPath(access, users), '/usuarios');
  assert.equal(canSee(access, base), false);
  assert.equal(navForPath('/roles'), access);
  assert.equal(navForPath('/usuarios'), access);
  assert.equal(homePathFor({ ...base, kind: 'client', portal: true }), '/portal-cliente');
  assert.equal(homePathFor(base), '/sin-acceso');
  assert.deepEqual(
    NAV.filter((item) => item.mobile && canSee(item, { ...base, sections: ['inicio'] })).map(
      (item) => item.to,
    ),
    ['/inicio', '/agenda'],
  );
  assert.equal(new Set(NAV.map((item) => item.to)).size, NAV.length);
});
