/** GelView::updateGelDetailViewContent: gel-local float coordinates and time. */
export function loupeSeed(anchor: {x: number; y: number}, time: number): number {
  const f = Math.fround;
  const position = f(f(f(anchor.x) * 19) + f(f(anchor.y) * 1723));
  const timePart = Math.trunc(f(f(time) * 2393));
  return Math.trunc(f(position + f(timePart))) >>> 0;
}
