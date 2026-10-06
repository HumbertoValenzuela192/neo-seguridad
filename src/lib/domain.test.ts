import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Account } from '../types';
import {
  computeOperator,
  DEFAULT_SALARY,
  installations,
  number,
  parseRange,
  validRut,
} from './domain';

test('legacy decimal values, RUT and camera tiers preserve their meaning', () => {
  assert.equal(number('1,25'), 1.25);
  assert.equal(number('1.25'), 1.25);
  assert.equal(number('39.123,45'), 39123.45);
  assert.deepEqual(parseRange('Más de 60'), { min: 61, max: Infinity });
  assert.deepEqual(parseRange('200 o más'), { min: 200, max: Infinity });
  assert.equal(validRut('12.345.678-5'), true);
  assert.equal(validRut('12.345.678-0'), false);
});
test('payroll retains rounding, proportional days and Isapre maximum', () => {
  const op = {
    name: 'Fixture',
    cargo: 'Operador',
    base: '800000',
    otros: '0',
    noImponibles: '50000',
    diasTrabajados: '30',
    horasAtraso: '0',
    horasExtra: '0',
    gratificacion: '200000',
  };
  const full = computeOperator(op, DEFAULT_SALARY);
  assert.equal(full.imponibles, 1000000);
  assert.equal(full.descAfp, 114400);
  assert.equal(full.descSalud, 70000);
  assert.equal(full.descCesantia, 6000);
  assert.equal(full.liquido, 859600);
  assert.equal(
    computeOperator({ ...op, diasTrabajados: '15' }, DEFAULT_SALARY).baseProporcional,
    400000,
  );
  assert.equal(
    computeOperator(op, { ...DEFAULT_SALARY, salud: 'isapre', plan: '3', uf: '40000' }).descSalud,
    120000,
  );
  assert.equal(
    computeOperator(op, { ...DEFAULT_SALARY, salud: 'isapre', plan: '1', uf: '40000' }).descSalud,
    70000,
  );
});
test('legacy installations keep the backend primary reference and contact metadata', () => {
  const a = {
    id: 'legacy-account',
    name: 'Fixture',
    user: 'fixture',
    role: 'cliente',
    installation: 'North',
    address: 'Road',
    mapLat: -33,
    mapLng: -70,
    callOrder: [{ name: 'Owner', phone: '111', cargo: 'Admin', email: 'fixture@example.test' }],
  };
  const [inst] = installations(a);
  assert.equal(inst.id, 'primary');
  assert.equal(inst.callOrder[0].email, 'fixture@example.test');
  assert.equal(inst.addresses[0].lat, -33);
  const recovered = installations({
    ...a,
    installations: [
      {
        id: 'stable-id',
        name: 'Recovered',
        guards: ['Guard'],
        callOrder: ['Owner'],
        coreVersion: 3,
      },
    ],
  } as unknown as Account)[0];
  assert.equal(recovered.id, 'stable-id');
  assert.equal(recovered.coreVersion, 3);
  assert.deepEqual(recovered.addresses, []);
  assert.equal(recovered.guards[0].name, 'Guard');
  assert.equal(recovered.callOrder[0].name, 'Owner');
});
