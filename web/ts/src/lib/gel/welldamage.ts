import { CinderRand } from '../sim/rng';
import type { Rect } from '../sim/band';
import { nativeOutputExtent, nativeWarpByte, type WarpTextureCpu } from './warpTexture';

export interface WellDamageParams {
  rect: Rect;
  wellDamage: number;
  wellDamageRandSeed: number;
}

interface Stab { c: number; rinv: number; h: number }

export function buildWellDamageWarp(
  p: WellDamageParams,
  gel: { width: number; height: number },
  pixelsPerUnit = 1
): WarpTextureCpu | null {
  if (Math.fround(p.wellDamage) <= 0) return null;

  const f = Math.fround;
  const damage = f(p.wellDamage);
  const x1n = f(f(p.rect.x1) / gel.width);
  const x2n = f(f(p.rect.x2) / gel.width);
  const wn = f(f(f(p.rect.x2) - f(p.rect.x1)) / gel.width);
  const yscale = Math.max(f(0.2), f(Math.pow(f(damage * .25), f(.85))));
  const nstabs = Math.max(1, Math.trunc(f(damage * 5)));
  const r = new CinderRand(p.wellDamageRandSeed);
  const stabs: Stab[] = [];
  for (let i = 0; i < nstabs; i++) {
    const c  = r.nextFloat(x1n, x2n);
    const rr = f(f(f(.05) + f(f(f(.5) - f(.05)) * f(r.nextFloat() * r.nextFloat()))) * wn);
    const h  = f(r.nextFloat(-1, 1) * yscale);
    stabs.push({ c, rinv: f(1 / rr), h });
  }

  const w = nativeOutputExtent(gel.width, pixelsPerUnit);
  const denom = f(1 / w);
  const data = new Uint8Array(w * 4);
  for (let i = 0; i < w; i++) {
    const px = f(i * denom);
    let dy = 0;
    for (const s of stabs) {
      const dist = f(Math.abs(f(s.c - px)) * s.rinv);
      if (dist < 1) dy = f(dy + f(f(1 - dist) * s.h));
    }
    let dx = 0;
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    data[i * 4 + 0] = nativeWarpByte(dx);
    data[i * 4 + 1] = nativeWarpByte(dy);
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }

  const bandH = f(f(p.rect.y2) - f(p.rect.y1));
  return {
    data, width: w, height: 1,
    scale: [f(bandH / gel.width), f(bandH / gel.height)],
  };
}
