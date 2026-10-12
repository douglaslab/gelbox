import type { Fragment, Sample } from './sample';
import type { SimContext } from './mobility';
import type { Rect } from './band';
import { fragToBands } from './gelSim';
import { GEL_SIM_TUNING } from '../../data/tuning';

export interface SolveOpts {
  targetY:  number;     // canvas-pixel Y to match against the band's rect.y1
  frag:     Fragment;   // fragment template; bases is replaced during search
  aggregate?: number; // native multimer tier selected by the drag (default monomer)
  lane:     number;
  ctx:      SimContext;
  wellRect: Rect;
}

/** Port of GelView::solveBasePairForY and Config::mSolverMaxIterations at 5f51097.
 * Native intentionally matches integer Y and returns its search guess, including
 * its unusual zero/negative-voltage behavior. Do not replace with binary search.
 */
export function solveBasesForY(opts: SolveOpts): number {
  const { frag, lane, ctx, wellRect, aggregate = 1 } = opts;
  const target = Math.trunc(Math.fround(opts.targetY));
  let bases = 1, stepSize = 1000, stepDirection = 1, iterationsLeft = 50;
  do {
    const sample: Sample = { buffer: ctx.sampleBuffer, fragments: [{ ...frag, bases }] };
    const band = fragToBands(sample, 0, wellRect, lane, ctx).find(b => b.aggregate === aggregate);
    if (!band) break;
    const y = Math.trunc(Math.fround(band.rect.y1));
    if (y === target) return bases;
    if ((y > target && stepDirection !== 1) || (y < target && stepDirection !== -1)) {
      stepDirection *= -1;
      stepSize = Math.trunc(stepSize / 4);
      if (stepSize <= 1) break;
    }
    bases += stepSize * stepDirection;
  } while (iterationsLeft-- > 0);
  return Math.max(1, Math.min(GEL_SIM_TUNING.baseCountHigh, bases));
}
