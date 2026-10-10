// Port of ~/code/gelbox/src/GelSim.cpp:317-473 (dyeToBand, fragAggregateToBand, fragToBands).
//
// fragToBands is the public entry. It dispatches by fragment type:
//   - mDye >= 0 + mass > 0:       single dye band
//   - empty aggregate or sum == 0: single monomer band
//   - else:                       one band per nonzero aggregate entry

import type { Band } from './band';
import type { SimContext } from './mobility';
import type { Sample, Fragment } from './sample';
import type { Rect } from './band';
import { GEL_SIM_TUNING } from '../../data/tuning';
import { calcDeltaY, calcDegradeAsBP } from './mobility';
import { calcBandAlpha } from './brightness';
import { calcBandDiffusion } from './diffusion';
import { calcBandGeometry, calcFlames, calcRandSeed, calcWellDamageRandSeed } from './geometry';
import { aggregateSum } from './aggregate';
import { DYE_BP_LO, DYE_COLORS, isValidDye } from './dye';

export type { SimContext } from './mobility';

function dyeToBand(_lane: number, dye: number, mass: number, ctx: SimContext, wellRect: Rect): Band {
  if (!isValidDye(dye)) throw new Error(`invalid dye index: ${dye}`);

  const bases = DYE_BP_LO[dye];
  const aggregate = 1;
  const aspectRatio = 1;

  // Dye bands diffuse like a 1bp fragment (max blur).
  const blur = Math.trunc(calcBandDiffusion(1, 1, 1, ctx));

  // Mobility (uses dye's BP_LO as the position; no degrade)
  const deltaY = calcDeltaY(bases, aggregate, aspectRatio, ctx) * ctx.ySpaceScale;
  const geom = calcBandGeometry(ctx, {
    wellRect, deltaY1: deltaY, deltaY2: deltaY, fatness: GEL_SIM_TUNING.wellToDyeHeightScale,
  });

  // Dye bands have NO flames, NO smile, NO welldamage (matches C++ "Disabled by SD").
  return {
    rect: geom.rect,
    smearAbove: geom.smearAbove,
    smearBelow: geom.smearBelow,
    smearBrightnessAbove: [1, 0],
    smearBrightnessBelow: [1, 0],
    flameHeight: 0,
    smileHeight: 0,
    smileExp: 0,
    blur,
    brightness: calcBandAlpha(mass, 0),
    color: [...DYE_COLORS[dye]] as [number, number, number],
    randSeed: 0,
    wellDamage: 0,
    wellDamageRandSeed: 0,
    mass,
    aggregate: 1,
    degrade: 0,
  };
}

function fragAggregateToBand(
  lane: number, frag: Fragment, aggregate: number, massScale: number,
  ctx: SimContext, wellRect: Rect,
): Band {
  if (aggregate <= 0) throw new Error(`aggregate must be > 0, got ${aggregate}`);

  const mass = frag.mass * massScale;
  const { lo: degradeLo, hi: degradeHi } = calcDegradeAsBP(frag.degrade, frag.bases);
  const blur = Math.trunc(calcBandDiffusion(frag.bases, aggregate, frag.aspectRatio, ctx));

  // Mobility: y1 from (bases - degradeHi), y2 from (bases - degradeLo)
  const deltaY1 = calcDeltaY(frag.bases - degradeHi, aggregate, frag.aspectRatio, ctx) * ctx.ySpaceScale;
  const deltaY2 = calcDeltaY(frag.bases - degradeLo, aggregate, frag.aspectRatio, ctx) * ctx.ySpaceScale;
  const geom = calcBandGeometry(ctx, {
    wellRect, deltaY1, deltaY2, fatness: GEL_SIM_TUNING.wellToHeightScale,
  });
  const height = geom.rect.y2 - geom.rect.y1;

  // Brightness assembly (C++ GelSim.cpp:376-383)
  const a = calcBandAlpha(mass, frag.degrade);
  const d = frag.degrade / 2;
  const brightness = Math.sqrt(a * (1 - d));
  const smearBrightnessBelowNear = Math.sqrt(a * d);
  // smearBrightnessAbove[0] starts at default 1, multiplied by brightness (C++: `*=`)
  const smearBrightnessAboveNear = 1 * brightness;

  // Seeds + smile + flames depend on rect, computed AFTER calcBandGeometry
  const randSeed = calcRandSeed(lane, mass, ctx.voltage, geom.rect.y1);
  const wellDamageRandSeed = calcWellDamageRandSeed(lane);
  const smileHeight = height * 0.35;
  const smileExp = 4;
  const flameHeight = height * calcFlames(mass);

  return {
    rect: geom.rect,
    smearAbove: geom.smearAbove,
    smearBelow: geom.smearBelow,
    smearBrightnessAbove: [smearBrightnessAboveNear, 0],
    smearBrightnessBelow: [smearBrightnessBelowNear, 0],
    flameHeight,
    smileHeight,
    smileExp,
    blur,
    brightness,
    color: [1, 1, 1],  // fragment bands always emit white; per-fragment color is metadata, applied at composite
    randSeed,
    wellDamage: ctx.wellDamage,
    wellDamageRandSeed,
    mass,
    aggregate,
    degrade: frag.degrade,
  };
}

export function fragToBands(
  sample: Sample, fragi: number, wellRect: Rect, lane: number, ctx: SimContext,
): Band[] {
  const frag = sample.fragments[fragi];
  if (!frag) throw new Error(`fragi out of range: ${fragi}`);

  if (frag.dye >= 0) {
    if (frag.mass <= 0) return [];
    return [dyeToBand(lane, frag.dye, frag.mass, ctx, wellRect)];
  }

  const asum = aggregateSum(frag.aggregate);
  if (frag.aggregate.length === 0 || asum === 0) {
    return [fragAggregateToBand(lane, frag, 1, 1, ctx, wellRect)];
  }

  const result: Band[] = [];
  for (let m = 0; m < frag.aggregate.length; m++) {
    const w = frag.aggregate[m];
    if (w > 0) {
      const massScale = w / asum;
      result.push(fragAggregateToBand(lane, frag, m + 1, massScale, ctx, wellRect));
    }
  }
  return result;
}
