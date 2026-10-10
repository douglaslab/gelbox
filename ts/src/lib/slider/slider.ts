export type SliderStyle = 'slider' | 'bar' | 'graph';
export type NotchAction = 'none' | 'drawOnly' | 'nearest' | 'snap';

export interface SliderConfig {
  /** Visual style. */
  style: SliderStyle;
  /** Mapped-value range; the slider's normalized 0..1 lerps between these. */
  valueMin: number;
  valueMax: number;
  /** If > 0, the mapped value is rounded to multiples of this step. */
  quantize: number;
  /** Optional snap targets in normalized 0..1 coords. */
  notches?: number[];
  /** How notches affect drag — see NotchAction. Default: 'none'. */
  notchAction?: NotchAction;
  /** For action='snap', drag must come within this normalized distance to snap. */
  notchSnapDist?: number;
  /** Optional formatter for the inline value label. */
  formatValue?: (mappedValue: number) => string;
  /** Whether the slider responds to input. Disabled sliders render dimmer. */
  enabled?: boolean;
}

export function lmap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMin === inMax) return outMin;
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

export function clamp(v: number, lo: number, hi: number): number {
  if (lo > hi) [lo, hi] = [hi, lo];
  return Math.max(lo, Math.min(hi, v));
}

/** Round v to nearest multiple of step. step <= 0 means no quantization. */
export function quantize(v: number, step: number): number {
  if (step <= 0) return v;
  return Math.round(v / step) * step;
}

/** Mapped value -> normalized 0..1 (mirrors Slider::calcNormalizedValue). */
export function calcNormalizedValue(mapped: number, cfg: Pick<SliderConfig, 'valueMin' | 'valueMax'>): number {
  return lmap(mapped, cfg.valueMin, cfg.valueMax, 0, 1);
}

/**
 * Normalized 0..1 -> mapped value (mirrors Slider::getMappedValue).
 * Quantizes after mapping then clamps to [valueMin, valueMax].
 */
export function getMappedValue(normalized: number, cfg: Pick<SliderConfig, 'valueMin' | 'valueMax' | 'quantize'>): number {
  let v = lmap(normalized, 0, 1, cfg.valueMin, cfg.valueMax);
  v = quantize(v, cfg.quantize);
  v = clamp(v, cfg.valueMin, cfg.valueMax);
  return v;
}

/** Native pullValueFromGetter -> getMappedValue, including float32 arithmetic.
 * The displayed value is quantized without writing it back to the model. */
export function getDisplayValue(value:number,cfg:Pick<SliderConfig,'valueMin'|'valueMax'|'quantize'>):number {
  const f=Math.fround,lo=f(cfg.valueMin),hi=f(cfg.valueMax),span=f(hi-lo);
  const normalized=span===0?0:f(f(f(value)-lo)/span);
  let mapped=f(lo+f(span*normalized));
  const step=f(cfg.quantize);
  if(step>0){
    const units=f(mapped/step);
    mapped=f(Math.sign(units)*Math.floor(Math.abs(units)+.5)*step);
  }
  return clamp(mapped,lo,hi);
}

/** Returns the notch closest to v in absolute distance. Returns v if notches empty. */
export function getNearestNotch(v: number, notches: number[]): number {
  if (notches.length === 0) return v;
  let bestNotch = notches[0];
  let bestDist  = Math.abs(notches[0] - v);
  for (let i = 1; i < notches.length; i++) {
    const d = Math.abs(notches[i] - v);
    if (d < bestDist) {
      bestDist = d;
      bestNotch = notches[i];
    }
  }
  return bestNotch;
}

/**
 * Apply notch snapping to a normalized 0..1 value per the action mode.
 * - 'none' / 'drawOnly': returns input unchanged.
 * - 'nearest': always snaps to the closest notch.
 * - 'snap': snaps to closest notch only if within snapDist of it.
 */
export function applyNotchSnap(
  v: number,
  notches: number[],
  action: NotchAction,
  snapDist: number,
): number {
  if (action === 'none' || action === 'drawOnly' || notches.length === 0) return v;
  const nearest = getNearestNotch(v, notches);
  if (action === 'nearest') return nearest;
  return Math.abs(nearest - v) <= snapDist ? nearest : v;
}
