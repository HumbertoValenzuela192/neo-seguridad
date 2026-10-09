// Requires Playwright + its WebKit browser, only for development (not the shipped app).
// node scripts/check-mobile.mjs [base URL] [optional absolute path to Playwright]
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { webkit } = createRequire(import.meta.url)(process.argv[3] || 'playwright');
const base = process.argv[2] || 'http://localhost:3000';
const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
await context.addInitScript(() => {
  window.mobileDraws = 0;
  for (const Type of [WebGLRenderingContext, WebGL2RenderingContext]) {
    const draw = Type.prototype.drawArrays;
    Type.prototype.drawArrays = function (...args) {
      window.mobileDraws++;
      return draw.apply(this, args);
    };
  }
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 230 }]) {
    await page.setViewportSize(viewport);
    for (const path of ['/', '/neo', '/central-24-7', '/contacto']) {
      assert.ok([200, 304].includes((await page.goto(base + path)).status()));
      await page.waitForFunction(() => getComputedStyle(document.querySelector('h1')).opacity === '1');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow: ${path} at ${viewport.width}px`);
    }
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
    assert.equal(await page.locator('#mobile-navigation').isVisible(), true);
    assert.ok(await page.locator('#mobile-navigation').evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'Menu must fit in landscape');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Abrir menú', exact: true }).getAttribute('aria-expanded'), 'false');
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/');
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.locator('#mobile-navigation a').filter({ hasText: /^NEO$/ }).click();
  await page.waitForFunction(() => document.documentElement.dataset.page === 'neo');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.page === 'neo');
  // No eager tiger tracing when visiting NEO; mobile GPU buffer follows the actual display size.
  await page.waitForFunction(() => !!document.querySelector('.neo-globe-metal.is-ready'));
  assert.ok(await page.locator('.neo-globe canvas').evaluate(canvas => canvas.width <= Math.ceil(canvas.clientWidth * 1.25)));
  assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('electricTrace.worker'))), false);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(250);
  const offscreen = await page.evaluate(() => window.mobileDraws);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.mobileDraws), offscreen, 'Offscreen effects must stop');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(count => window.mobileDraws > count, offscreen);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await page.evaluate(() => window.mobileDraws);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.mobileDraws), hidden, 'Hidden page must stop drawing');
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(count => window.mobileDraws > count, hidden);
  await page.locator('.neo-globe canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(() => !document.querySelector('.neo-globe canvas'));
  assert.equal(await page.locator('.neo-globe-fallback').isVisible(), true, 'Context loss must preserve the logo');

  await page.goto(base + '/contacto');
  await page.route('**/api/leads', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Prueba: reintenta sin cerrar la página.' }) }));
  await page.getByLabel('Empresa', { exact: true }).fill('Prueba móvil');
  await page.getByLabel('RUT', { exact: true }).fill('12.345.678-5');
  await page.getByLabel('Nombre del contacto').fill('Contacto de prueba');
  await page.getByLabel('Correo corporativo').fill('prueba@example.test');
  await page.getByLabel('Teléfono').fill('+56912345678');
  await page.getByLabel('Cantidad de cámaras').fill('2');
  await page.getByLabel('Solución', { exact: true }).selectOption({ label: 'NEO' });
  await page.getByLabel('Cantidad de operadores').fill('1');
  assert.equal(await page.getByLabel('Correo corporativo').evaluate(el => getComputedStyle(el).fontSize), '16px');
  await page.getByRole('button', { name: 'Solicitar evaluación', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByLabel('Empresa', { exact: true }).inputValue(), 'Prueba móvil');

  // WebGL unavailable (older hardware / browser policy): content and static logos still work.
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.goto(base + '/neo');
  await page.waitForFunction(() => !document.querySelector('.neo-globe canvas') && getComputedStyle(document.querySelector('h1')).opacity === '1');
  assert.equal(await page.locator('.neo-globe-fallback').isVisible(), true);
  await page.goto(base + '/');
  await page.waitForFunction(() => document.documentElement.classList.contains('fx-off'));
  assert.equal(await page.locator('.hero-mark').evaluate(el => getComputedStyle(el).opacity), '1');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '/neo');
  assert.equal(await page.locator('.neo-globe-fallback').isVisible(), true);
  assert.equal(await page.locator('canvas').count(), 0);
  assert.deepEqual(errors, [], 'No unhandled browser errors');
  console.log('WebKit mobile: routes, landscape menu, navigation/reload, GPU fallback, reduced motion and form recovery passed.');
} finally {
  await browser.close();
}
