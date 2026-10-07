import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validRut } from './domain';
test('contact RUT validation preserves check digits', () => {
  assert.equal(validRut('12.345.678-5'), true);
  assert.equal(validRut('12.345.678-4'), false);
  assert.equal(validRut('invalid'), false);
});
