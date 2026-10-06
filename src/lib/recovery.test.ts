import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserBackup, preserveBrowserData, recoverBeforeLoad } from './recovery';
test('browser-only data is archived asynchronously before canonical loading, without replacing storage methods', async () => {
  const original = JSON.stringify([
    { id: 'browser-only', user: 'fixture', installations: [{ id: 'old-id', name: 'North' }] },
  ]);
  function storage() {
    const values = new Map<string, string>();
    return {
      get length() {
        return values.size;
      },
      key: (i: number) => [...values.keys()][i] ?? null,
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => {
        values.set(k, String(v));
      },
      removeItem: (k: string) => {
        values.delete(k);
      },
      clear: () => values.clear(),
    };
  }
  const local = storage(),
    session = storage(),
    calls: string[] = [],
    payloads: unknown[] = [];
  const previous = {
    local: globalThis.localStorage,
    session: globalThis.sessionStorage,
    location: globalThis.location,
    fetch: globalThis.fetch,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });
  Object.defineProperty(globalThis, 'location', {
    value: { origin: 'https://fixture.invalid' },
    configurable: true,
  });
  local.setItem('neo_cuentas_cliente', original);
  const native = local.setItem;
  globalThis.fetch = async (input, options) => {
    calls.push(String(input));
    payloads.push(JSON.parse(String(options?.body)));
    return new Response(
      JSON.stringify(
        String(input).includes('recovery') ? { archive_id: 'fixture-archive' } : { accounts: 1 },
      ),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };
  try {
    const backup = preserveBrowserData();
    assert.equal(local.setItem, native);
    await recoverBeforeLoad(
      {
        kind: 'user',
        id: 'fixture',
        name: 'Admin',
        sections: ['usuarios', 'cuentas'],
        portal: false,
      },
      backup,
    );
    assert.deepEqual(calls, ['/api/recovery', '/api/directory/import']);
    assert.equal(
      (payloads[0] as { values: Record<string, string> }).values.neo_cuentas_cliente,
      original,
    );
    assert.equal(local.getItem('neo_cuentas_cliente'), original);
    assert.equal(local.getItem('neo_recovery_uploaded_20261006'), 'fixture-archive');
    assert.equal(
      browserBackup(local as Storage, 'https://fixture.invalid').archivedBrowserCopy?.values
        .neo_cuentas_cliente,
      original,
    );
    await recoverBeforeLoad(
      {
        kind: 'user',
        id: 'fixture',
        name: 'Admin',
        sections: ['usuarios', 'cuentas'],
        portal: false,
      },
      backup,
    );
    assert.equal(calls.length, 2);
  } finally {
    for (const [key, value] of [
      ['localStorage', previous.local],
      ['sessionStorage', previous.session],
      ['location', previous.location],
    ] as const)
      Object.defineProperty(globalThis, key, { value, configurable: true });
    globalThis.fetch = previous.fetch;
  }
});
