import { mulberry32, rangeFloat } from '../sim/rng';
import type { Rect } from '../sim/band';
import type { WarpTextureCpu } from './smile';

export interface WellDamageParams {
  rect: Rect;
  wellDamage: number;
  wellDamageRandSeed: number;
}

interface Stab { c: number; rinv: number; h: number }

export function buildWellDamageWarp(
  p: WellDamageParams,
  gel: { width: number; height: number }
): WarpTextureCpu | null {
  if (p.wellDamage <= 0) return null;

  const x1n = p.rect.x1 / gel.width;
  const x2n = p.rect.x2 / gel.width;
  const wn  = (p.rect.x2 - p.rect.x1) / gel.width;
  const yscale = Math.max(0.2, Math.pow(p.wellDamage * 0.25, 0.85));
  const nstabs = Math.max(1, Math.floor(p.wellDamage * 5));

  const r = mulberry32(p.wellDamageRandSeed);
  const stabs: Stab[] = [];
  for (let i = 0; i < nstabs; i++) {
    const c  = rangeFloat(r, x1n, x2n);
    const rr = (0.05 + (0.5 - 0.05) * (r() * r())) * wn;
    const h  = rangeFloat(r, -1, 1) * yscale;
    stabs.push({ c, rinv: 1 / rr, h });
  }

  const w = gel.width;
  const data = new Uint8Array(w * 4);
  for (let i = 0; i < w; i++) {
    const px = i / w;
    let dy = 0;
    for (const s of stabs) {
      const dist = Math.abs(s.c - px) * s.rinv;
      if (dist < 1) dy += (1 - dist) * s.h;
    }
    let dx = 0;
    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));
    data[i * 4 + 0] = Math.round(((dx + 1) * 0.5) * 255);
    data[i * 4 + 1] = Math.round(((dy + 1) * 0.5) * 255);
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }

  const bandH = p.rect.y2 - p.rect.y1;
  return {
    data, width: w, height: 1,
    scale: [bandH / gel.width, bandH / gel.height],
  };
}
