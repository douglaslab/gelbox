
/**
 * 12 fragment colors arranged 4 cols × 3 rows.
 * Source: ~/code/gelbox/src/FragmentView.cpp:25 — `getColorPalette()`.
 */
export const FRAGMENT_PALETTE_HEX = [
  '#0066cc', '#cc0000', '#f74308', '#f7931e',
  '#aaaa00', '#57bb00', '#007200', '#03b6a2',
  '#1700de', '#7300de', '#b8056c', '#333333',
] as const;

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  // Cinder Color::hex stores channel/255 directly, including native JSON.
  return [r, g, b];
}

export const FRAGMENT_PALETTE_RGB: readonly [number, number, number][] =
  FRAGMENT_PALETTE_HEX.map(hexToRgb);


/** ColorPaletteView::pullValueFromGetter; first nearest native float RGB distance. */
export function nearestPaletteIndex(color: readonly [number,number,number],
  palette: readonly (readonly [number,number,number])[] = FRAGMENT_PALETTE_RGB): number {
  const f = Math.fround;
  let closest = 0, best = Infinity;
  for (let i=0;i<palette.length;i++) {
    const dr=f(f(palette[i][0])-f(color[0]));
    const dg=f(f(palette[i][1])-f(color[1]));
    const db=f(f(palette[i][2])-f(color[2]));
    const distance=f(Math.sqrt(f(f(f(dr*dr)+f(dg*dg))+f(db*db))));
    if (distance < best) { closest=i; best=distance; }
  }
  return closest;
}
