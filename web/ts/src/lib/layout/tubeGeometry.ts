import type { Rect } from '../sim/band';
import { LAYOUT } from './layout';

/** GelView tube geometry in gel-local coordinates; View::snapToPixel preserves size. */
export function tubeGeometry(width: number, height: number, lanes: number, lane: number) {
  const w = width / lanes;
  const cx = w * (lane + .5);
  const gutter = Math.min(LAYOUT.gelMicrotubeIconToGelGutter, w * .25);
  const radius = Math.min(LAYOUT.gelMicrotubeBkgndCornerRadius, w * .4);
  const well: Rect = { x1: cx - radius, x2: cx + radius,
    y1: -w + LAYOUT.gelMicrotubeWellPadding / 2 - gutter,
    y2: -LAYOUT.gelMicrotubeWellPadding / 2 - gutter };
  const inset = Math.min(LAYOUT.gelMicrotubeIconPadding, radius * .5);
  const scale = Math.min((2 * radius - 2 * inset) / 47, (well.y2 - well.y1) / 89);
  const iw = 47 * scale, ih = 89 * scale;
  // C++ roundf rounds negative halves away from zero.
  const round = (x: number) => Math.sign(x) * Math.round(Math.abs(x));
  const x = round(cx - iw / 2), y = round((well.y1 + well.y2 - ih) / 2);
  return { well, radius,
    icon: { x1: x, y1: y, x2: x + iw, y2: y + ih },
    hit: { ...well, y2: 0 },
    background: { ...well, y1: well.y1 + Math.min(LAYOUT.gelMicrotubeBkgndTopInsetFromIcon, (well.y2 - well.y1) * .5), y2: height },
  };
}
