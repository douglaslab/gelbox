import type { Fragment } from '../sim/sample';
import { FRAGMENT_PALETTE_RGB } from '../fragment/palette';
import type { Rng } from '../sim/rng';

export function randomFragmentColor(random: Rng = Math.random): [number, number, number] {
  return [...FRAGMENT_PALETTE_RGB[Math.floor(random() * FRAGMENT_PALETTE_RGB.length)]];
}

/** Native SampleView::newFragment with default (zero) multimer/aspect chances. */
export function newFragment(random: Rng = Math.random): Fragment {
  const color = randomFragmentColor(random);
  return { color, bases: Math.trunc(1 + 13999 * random() * random()),
    mass: random() * 175, aspectRatio: 1, degrade: 0, dye: -1,
    aggregate: [1, 0, 0, 0, 0, 0, 0] };
}
