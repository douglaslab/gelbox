import type { Fragment, Sample } from './sample';
import type { SimContext } from './mobility';
import type { Rect } from './band';
import { fragToBands } from './gelSim';
import { GEL_SIM_TUNING } from '../../data/tuning';

export interface SolveOpts {
  targetY:  number;     // canvas-pixel Y to match against the band's rect.y1
  frag:     Fragment;   // fragment template; bases is replaced during search
  lane:     number;
  ctx:      SimContext;
  wellRect: Rect;
}

const MAX_ITER = 30;

/**
 * Binary-search bp ∈ [1, baseCountHigh] such that `fragToBands` produces a
 * band whose rect.y1 best matches `targetY`. Mirrors the C++
 * `solveBasePairForY` solver. Monotonicity is implicit in calcDeltaY:
 * bigger bp → smaller deltaY → smaller rect.y1 (closer to well at top).
 *
 * Returns an integer bp. Iteration count is capped at 30; the search
 * converges to single-bp precision in <17 iterations on a 14000-bp range.
 */
export function solveBasesForY(opts: SolveOpts): number {
  const { targetY, frag, lane, ctx, wellRect } = opts;
  const upper = GEL_SIM_TUNING.baseCountHigh;

  function bandY1At(bases: number): number {
    const sample: Sample = { buffer: ctx.sampleBuffer, fragments: [{ ...frag, bases }] };
    const bands = fragToBands(sample, 0, wellRect, lane, ctx);
    return bands[0].rect.y1;
  }

  // Boundary checks: if target is unachievable, clamp.
  const yAtMin = bandY1At(1);          // smallest bp → largest y
  const yAtMax = bandY1At(upper);      // largest bp → smallest y
  if (targetY >= yAtMin) return 1;
  if (targetY <= yAtMax) return upper;

  // Standard integer binary search.
  let lo = 1;
  let hi: number = upper;
  for (let i = 0; i < MAX_ITER; i++) {
    if (hi - lo <= 1) break;
    const mid = Math.floor((lo + hi) / 2);
    const y = bandY1At(mid);
    if (y > targetY) {
      // Need larger bp (smaller y).
      lo = mid;
    } else {
      // Need smaller bp (larger y).
      hi = mid;
    }
  }
  // Pick the side closer to target.
  return Math.abs(bandY1At(lo) - targetY) < Math.abs(bandY1At(hi) - targetY) ? lo : hi;
}
