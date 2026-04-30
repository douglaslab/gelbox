// Generates fixtures/states/ladder-1kb.json — a canonical sample fixture
// representing a 1 kb ladder spanning 100 bp to 13500 bp, suitable for
// driving fragToBands and producing a recognizable Sample-driven scene.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, '..', 'fixtures', 'states', 'ladder-1kb.json');

const sizes = [100, 200, 400, 800, 1600, 3200, 6400, 9000, 12000, 13500];
const fragments = sizes.map((bp) => ({
  bases: bp,
  mass: 50,
  degrade: 0,
  dye: -1,
  aggregate: [],
  aspectRatio: 1,
  color: [1, 1, 1],
}));

const fixture = {
  schema: 'gel-sample-v0',
  // Buffer: TBE 0.5×
  buffer: { tris: 44.5, borate: 44.5, acetate: 0, edta: 1 },
  fragments,
};

writeFileSync(out, JSON.stringify(fixture, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${out} (${fragments.length} fragments)`);
