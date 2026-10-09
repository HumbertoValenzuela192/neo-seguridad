// Cálculo de la silueta del logo (campo de distancias, bordes y halo). Es código puro: se ejecuta
// en un worker cuando el navegador lo permite, para no bloquear la hidratación de la página.
export const RASTER = 560;
export const CELL = 4;
const FAR = 1e20;

const transformLine = (f, d, v, z, n) => {
  let k = 0;
  v[0] = 0;
  z[0] = -FAR;
  z[1] = FAR;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = FAR;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
};

const transformGrid = (grid, w, h) => {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    transformLine(f, d, v, z, h);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    transformLine(f, d, v, z, w);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }
};

const blurLine = (src, dst, offset, stride, n, r) => {
  const scale = 1 / (2 * r + 1);
  let sum = 0;
  for (let i = 0; i <= r && i < n; i++) sum += src[offset + i * stride];
  for (let i = 0; i < n; i++) {
    dst[offset + i * stride] = sum * scale;
    if (i + r + 1 < n) sum += src[offset + (i + r + 1) * stride];
    if (i - r >= 0) sum -= src[offset + (i - r) * stride];
  }
};

const blurGrid = (grid, w, h, r) => {
  const tmp = new Float32Array(w * h);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) blurLine(grid, tmp, y * w, 1, w, r);
    for (let x = 0; x < w; x++) blurLine(tmp, grid, x, w, h, r);
  }
};

export const readCoverage = (data, w, h) => {
  const coverage = new Float32Array(w * h);
  let clear = 0;
  for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] < 250) clear++;
  if (clear > w * h * 0.01) {
    for (let i = 0; i < w * h; i++) coverage[i] = data[i * 4 + 3] / 255;
    return coverage;
  }
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const sample = (i) => {
    r += data[i * 4];
    g += data[i * 4 + 1];
    b += data[i * 4 + 2];
    n++;
  };
  for (let x = 0; x < w; x++) {
    sample(x);
    sample((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    sample(y * w);
    sample(y * w + w - 1);
  }
  r /= n;
  g /= n;
  b /= n;
  for (let i = 0; i < w * h; i++) {
    const diff = Math.max(
      Math.abs(data[i * 4] - r),
      Math.abs(data[i * 4 + 1] - g),
      Math.abs(data[i * 4 + 2] - b),
    );
    coverage[i] = Math.min(1, Math.max(0, (diff - 24) / 48));
  }
  return coverage;
};

export const traceCoverage = (coverage, w, h) => {
  let left = w;
  let top = h;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (coverage[y * w + x] <= 0.01) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < 0) return null;

  const logoWidth = right - left + 1;
  const logoHeight = bottom - top + 1;
  const pad = Math.ceil(Math.max(logoWidth, logoHeight) * 0.25) + 2;
  const width = logoWidth + pad * 2;
  const height = logoHeight + pad * 2;
  const outer = new Float32Array(width * height);
  const inner = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = x - pad + left;
      const sy = y - pad + top;
      const a = sx >= 0 && sy >= 0 && sx < w && sy < h ? coverage[sy * w + sx] : 0;
      const i = y * width + x;
      if (a >= 1) {
        outer[i] = 0;
        inner[i] = FAR;
      } else if (a <= 0) {
        outer[i] = FAR;
        inner[i] = 0;
      } else {
        const e = 0.5 - a;
        outer[i] = e > 0 ? e * e : 0;
        inner[i] = e < 0 ? e * e : 0;
      }
    }
  }
  transformGrid(outer, width, height);
  transformGrid(inner, width, height);

  const field = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) field[i] = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);

  const points = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const d = field[i];
      if (d > 0) continue;
      if (field[i - 1] <= 0 && field[i + 1] <= 0 && field[i - width] <= 0 && field[i + width] <= 0)
        continue;
      const gx = field[i + 1] - field[i - 1];
      const gy = field[i + width] - field[i - width];
      const len = Math.hypot(gx, gy) || 1;
      points.push(x + 0.5 - (d * gx) / len, y + 0.5 - (d * gy) / len);
    }
  }
  const stride = Math.max(1, Math.ceil(points.length / 2 / 3000)) * 2;
  const edges = [];
  for (let i = 0; i < points.length; i += stride) edges.push(points[i], points[i + 1]);

  const size = Math.max(logoWidth, logoHeight);
  const glowPad = Math.ceil((size * 0.7) / CELL);
  const glowWidth = Math.ceil(logoWidth / CELL) + glowPad * 2;
  const glowHeight = Math.ceil(logoHeight / CELL) + glowPad * 2;
  const tight = new Float32Array(glowWidth * glowHeight);
  for (let y = 0; y < height; y++) {
    const gy = Math.floor((y - pad) / CELL) + glowPad;
    for (let x = 0; x < width; x++) {
      const gx = Math.floor((x - pad) / CELL) + glowPad;
      tight[gy * glowWidth + gx] += Math.exp(-Math.abs(field[y * width + x]) / 1.5) / (CELL * CELL);
    }
  }
  const wide = tight.slice();
  const tightRadius = Math.max(1, Math.round((size * 0.035) / CELL));
  const wideRadius = Math.max(2, Math.round((size * 0.13) / CELL));
  blurGrid(tight, glowWidth, glowHeight, tightRadius);
  blurGrid(wide, glowWidth, glowHeight, wideRadius);
  const tightNorm = (Math.sqrt(2 * Math.PI * (tightRadius * tightRadius + tightRadius)) * CELL) / 3;
  const wideNorm = (Math.sqrt(2 * Math.PI * (wideRadius * wideRadius + wideRadius)) * CELL) / 3;
  const glow = new Float32Array(glowWidth * glowHeight * 2);
  for (let i = 0; i < glowWidth * glowHeight; i++) {
    glow[i * 2] = tight[i] * tightNorm;
    glow[i * 2 + 1] = wide[i] * wideNorm;
  }

  return {
    field,
    edges,
    width,
    height,
    pad,
    logoWidth,
    logoHeight,
    glow,
    glowWidth,
    glowHeight,
    glowOffset: pad - glowPad * CELL,
  };
};
