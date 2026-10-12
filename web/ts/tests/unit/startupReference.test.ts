import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { initialGelState } from '../../src/lib/gel/gelState';
import { serializeGelState } from '../../src/lib/gel/serialize';
it('starts with the exact native ladder document, including colors and sample metadata', () => {
  const native = JSON.parse(readFileSync('../reference/native/files/ladder-after-selection.gel.json', 'utf8'));
  expect(JSON.parse(serializeGelState(initialGelState()))).toEqual(native);
});
