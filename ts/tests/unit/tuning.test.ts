import { describe, it, expect } from 'vitest';
import { GEL_RENDER_TUNING } from '../../src/data/tuning';

describe('GEL_RENDER_TUNING', () => {
  it('matches the gel-render.json live-branch values', () => {
    expect(GEL_RENDER_TUNING.overcook.scale).toEqual([5, 10]);
    expect(GEL_RENDER_TUNING.h2oDistort.faint).toBe(0.25);
    expect(GEL_RENDER_TUNING.h2oDistort.overcook).toBe(3.5);
  });
});
