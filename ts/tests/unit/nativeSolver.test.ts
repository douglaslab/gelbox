import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { solveBasesForY } from '../../src/lib/sim/solver';
const root = '../reference/native/numerical/';
const cases = JSON.parse(readFileSync(root+'cases.json','utf8'));
const outputs = JSON.parse(readFileSync(root+'release-x86_64/outputs.json','utf8'));
it.each(cases.map((c: any, i: number) => [c.id,c,outputs[i]]))('native inverse solver: %s', (_id,c,ref) => {
  expect(ref.solved).toHaveLength(c.solverTargets.length);
  for(const expected of ref.solved) {
    expect.soft(solveBasesForY({ targetY: expected.targetY, aggregate: expected.aggregate,
      frag: c.sample.fragments[c.fragment], lane: c.lane, ctx:c.ctx, wellRect:c.wellRect }),
    `target ${expected.targetY}, aggregate ${expected.aggregate}`).toBe(expected.bases);
  }
});
