import { expect, it } from 'vitest';
import { initialHoverLoupe, hoverLoupeReducer as reduce } from '../../src/lib/gel/hoverLoupe';
const point = { x: 25, y: 75 };
it('native hover defaults off; Meta activates at a stationary pointer without focus/persistent state', () => {
  let s = reduce(initialHoverLoupe(), { type: 'move', point });
  expect(s.preview).toBeNull();
  s = reduce(s, { type: 'key', meta: true, toggle: false });
  expect(s.preview).toMatchObject({ anchor: point, frame: { x: 110.5, y: -10.5 } });
  expect(reduce(s, { type: 'key', meta: false, toggle: false }).preview).toBeNull();
});
it('Meta-L toggle survives release and document replacement, but not a fresh app', () => {
  let s = reduce(initialHoverLoupe(), { type: 'move', point });
  s = reduce(s, { type: 'key', meta: true, toggle: true });
  s = reduce(s, { type: 'key', meta: false, toggle: false });
  expect(s.preview?.anchor).toEqual(point);
  s = reduce(s, { type: 'replace' });
  expect(s.preview?.anchor).toEqual(point); expect(s.enabled).toBe(true);
  expect(reduce(s, { type: 'move', point }).preview).not.toBeNull();
  expect(initialHoverLoupe().enabled).toBe(false);
});
it('native rollover clears on down, refresh closes on edit, up alone does not reopen', () => {
  let s = reduce(initialHoverLoupe(), { type: 'key', meta: false, toggle: true });
  s = reduce(s, { type: 'move', point }); const preview = s.preview;
  s = reduce(s, { type: 'down', persistent: false });
  expect(s.preview).toBe(preview); expect(s.point).toBeNull();
  s = reduce(s, { type: 'refresh' }); expect(s.preview).toBeNull();
  s = reduce(s, { type: 'up', point }); expect(s.preview).toBeNull();
  expect(reduce(s, { type: 'move', point }).preview).not.toBeNull();
});
it('creation closes preview immediately, and exit/blur/cancel cannot retain it', () => {
  let s = reduce(initialHoverLoupe(), { type: 'key', meta: true, toggle: false });
  s = reduce(s, { type: 'move', point });
  expect(reduce(s, { type: 'down', persistent: true }).preview).toBeNull();
  expect(reduce(s, { type: 'move', point: null }).preview).toBeNull();
  const canceled = reduce(s, { type: 'cancel' });
  expect(canceled.preview).toBeNull(); expect(canceled.meta).toBe(false); expect(canceled.point).toBeNull();
});
it('refresh reuses native view identity but resamples even at the same position', () => {
  let s = reduce(initialHoverLoupe(), { type: 'key', meta: true, toggle: false });
  s = reduce(s, { type: 'move', point });
  const refreshed = reduce(s, { type: 'refresh' });
  expect(refreshed.preview?.id).toBe(s.preview?.id);
  expect(refreshed.preview?.anchor).not.toBe(s.preview?.anchor);
});

it('native replacement refreshes only when gel retains rollover', () => {
  let s = reduce(initialHoverLoupe(), { type: 'key', meta: true, toggle: false });
  s = reduce(s, { type: 'move', point });
  expect(reduce(s, { type: 'replace' }).preview).not.toBe(s.preview);
  s = reduce(s, { type: 'down', persistent: false });
  expect(reduce(s, { type: 'replace' }).preview).toBeNull();
});
