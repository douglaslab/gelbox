export type Rng = () => number;  // returns float in [0, 1)

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rangeFloat(r: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * r();
}

export function rangeInt(r: Rng, lo: number, hi: number): number {
  return Math.floor(lo + (hi - lo) * r());
}
