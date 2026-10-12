import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { buildSmileWarp } from '../../src/lib/gel/smile';
import { buildWellDamageWarp } from '../../src/lib/gel/welldamage';
import { buildOvercookWarp } from '../../src/lib/gel/overcook';
const cases = JSON.parse(readFileSync('../reference/native/numerical/warp-cases.json', 'utf8'));
const refs = JSON.parse(readFileSync('../reference/native/numerical/warp-outputs.json', 'utf8'));
it.each(cases.map((c: any, i: number) => [c.id, c, refs[i]]))('native warp bytes: %s', (_id, c, ref) => {
  expect(c.id).toBe(ref.id);
  const gel = { width: c.width, height: c.height };
  const [x1, y1, x2, y2] = c.rect;
  const actual = c.kind === 'smile'
    ? buildSmileWarp({ x1, x2, smileHeight: c.amount, smileExp: c.exp }, gel, c.ppu)
    : c.kind === 'damage'
      ? buildWellDamageWarp({ rect: { x1, y1, x2, y2 }, wellDamage: c.amount, wellDamageRandSeed: c.seed }, gel, c.ppu)
      : buildOvercookWarp({ h2oDistort: c.amount > 0, randSeed: c.seed }, gel, c.ppu);
  if (!ref.warp) { expect(actual).toBeNull(); return; }
  expect(actual).not.toBeNull();
  expect(actual!.width).toBe(ref.warp.width);
  expect(actual!.height).toBe(ref.warp.height);
  expect(actual!.scale).toEqual(ref.warp.scale);
  // All channels at every pixel; no tolerance can hide a changed quantization.
  const mismatch = Array.from(actual!.data).flatMap((byte, i) => byte === ref.warp.data[i] ? [] : [{ i, byte, native: ref.warp.data[i] }]);
  expect(mismatch.slice(0, 12), `${mismatch.length} mismatching bytes`).toEqual([]);
  expect(actual!.data.length).toBe(ref.warp.data.length);
});
