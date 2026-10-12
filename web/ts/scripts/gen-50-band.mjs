// Generates fixtures/states/50-band.json — a 320x240 gel with 50 bands
// roughly evenly distributed vertically, decreasing brightness toward
// the bottom (small molecules ran far), with H2ODistort enabled.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, '..', 'fixtures', 'states', '50-band.json');

const bands = [];
const N = 50;
for (let i = 0; i < N; i++) {
  const t = i / (N - 1);  // 0..1 top→bottom
  const yMid = 30 + t * 200;  // y in 30..230
  const h = 4 + (1 - t) * 6;  // taller at top, thinner at bottom
  const halfH = h / 2;
  const x1 = 50 + (i % 5) * 4;     // small horizontal jitter
  const x2 = 270 - (i % 7) * 3;
  bands.push({
    rect: { x1, y1: yMid - halfH, x2, y2: yMid + halfH },
    smearAbove: 2 + (1 - t) * 5,
    smearBelow: 5 + (1 - t) * 12,
    smearBrightnessAbove: [0.4 - 0.2 * t, 0.0],
    smearBrightnessBelow: [0.30 - 0.15 * t, 0.0],
    flameHeight: 4 + (1 - t) * 8,
    smileHeight: 3 + 2 * Math.sin(i * 0.7),
    smileExp: 1.2 + 0.4 * (i % 3),
    blur: 1 + (i % 3),
    brightness: 0.7 - 0.4 * t,
    color: [
      1.0,
      0.85 + 0.10 * Math.sin(i),
      0.60 + 0.20 * Math.cos(i * 0.5),
    ],
    randSeed: i + 1,
    wellDamage: 0.2 + 0.3 * Math.abs(Math.sin(i * 1.3)),
    wellDamageRandSeed: 100 + i,
  });
}

const fixture = {
  schema: 'gel-state-v0',
  gelSize: { width: 320, height: 240 },
  pixelsPerUnit: 1,
  globalWarp: { h2oDistort: true, randSeed: 0 },
  bands,
};

writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${out} (${bands.length} bands)`);
