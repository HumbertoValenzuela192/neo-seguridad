import { RASTER, readCoverage, traceCoverage } from './electricTrace.js';

// Descarga el logo, lo rasteriza y calcula su silueta fuera del hilo principal.
self.onmessage = async ({ data }) => {
  try {
    const blob = await (await fetch(data.src)).blob();
    const bitmap = await createImageBitmap(blob);
    const fit = RASTER / Math.max(bitmap.width, bitmap.height);
    const w = Math.max(2, Math.round(bitmap.width * fit));
    const h = Math.max(2, Math.round(bitmap.height * fit));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, w, h);
    const shape = traceCoverage(readCoverage(ctx.getImageData(0, 0, w, h).data, w, h), w, h);
    if (!shape) throw new Error('sin silueta');
    self.postMessage({ shape }, [shape.field.buffer, shape.glow.buffer]);
  } catch {
    self.postMessage({ shape: null });
  }
};
