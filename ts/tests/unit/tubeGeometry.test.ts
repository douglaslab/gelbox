import { expect, it } from 'vitest';
import { tubeGeometry } from '../../src/lib/layout/tubeGeometry';
it('matches the native seven-lane well, hit area and fitted asset', () => {
  const g = tubeGeometry(390, 520, 7, 0);
  expect(g.well.x1).toBeCloseTo(7.857142857);
  expect(g.well.y1).toBeCloseTo(-59.714285714);
  expect(g.well.y2).toBe(-8);
  expect(g.hit.y2).toBe(0);
  expect(g.background.y1).toBeCloseTo(-43.714285714);
  expect(g.background.y2).toBe(520);
  expect(g.radius).toBe(20);
  expect(g.icon.x1).toBe(18);
  expect(g.icon.y1).toBe(-53);
  expect(g.icon.x2 - g.icon.x1).toBeCloseTo(20);
  expect(g.icon.y2 - g.icon.y1).toBeCloseTo(20 * 89 / 47);
});
it('shrinks native wells and icon at twenty lanes', () => {
  const g = tubeGeometry(390, 520, 20, 19);
  expect(g.well.x1).toBeCloseTo(372.45);
  expect(g.well.y1).toBeCloseTo(-22.375);
  expect(g.well.y2).toBeCloseTo(-6.875);
  expect(g.radius).toBeCloseTo(7.8);
  expect(g.background.y1).toBeCloseTo(-14.625);
  expect(g.icon.x1).toBe(376);
  expect(g.icon.y1).toBe(-22);
  expect(g.icon.x2 - g.icon.x1).toBeCloseTo(7.8);
});
