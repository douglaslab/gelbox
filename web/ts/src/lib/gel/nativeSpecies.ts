import {FRAGMENT_PALETTE_RGB} from '../fragment/palette';
import {GEL_SIM_TUNING} from '../../data/tuning';
import type {CinderRand} from '../sim/rng';
import type {Fragment} from '../sim/sample';

/** Palette::getRandomColor: signed int converts to native 64-bit size_t. */
export function nativeFragmentColor(random:CinderRand):[number,number,number] {
  const index=Number(BigInt.asUintN(64,BigInt(random.nextInt())) % BigInt(FRAGMENT_PALETTE_RGB.length));
  const [r,g,b]=FRAGMENT_PALETTE_RGB[index];
  return [Math.fround(r),Math.fround(g),Math.fround(b)];
}

/** SampleView::newFragment generation with pinned zero aspect/multimer chances.
 * The owning command applies the fragment and its change notifications. */
export function nativeSpecies(random:CinderRand):Fragment {
  const f=Math.fround;
  const color=nativeFragmentColor(random);
  const bases=Math.trunc(f(1+f(13999*f(random.nextFloat()*random.nextFloat()))));
  const mass=f(random.nextFloat()*f(GEL_SIM_TUNING.sampleMassHigh));
  // Native evaluates both chance tests even when the configured chances are 0.
  random.nextFloat();
  random.nextFloat();
  return {color,bases,mass,aspectRatio:1,degrade:0,dye:-1,aggregate:[1,0,0,0,0,0,0]};
}
