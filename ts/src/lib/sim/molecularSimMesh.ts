import { type Mesh, VERTEX_STRIDE } from '../gel/mesh';
import type { Part } from './molecularSimEngine';

export interface MeshBuildTuning {
  numCirclePartVertices: number;
  multimerAdhereOverlapFrac: number;
  outlineWidth: number;
  selectColor: readonly [number, number, number];
  hoverColor:  readonly [number, number, number];
}

type RGB = readonly [number, number, number];

function lerp3(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Pure port of MolecularSim::makeMoleculesMesh + Part::makeMesh + makeMesh_slice.
 *
 * For each part, in C++ draw order: an OUTLINE sub-pass (only if the part's
 * fragment is selected or rollover; geometry inflated by outlineWidth, in the
 * select/hover color) followed by a FILL sub-pass (part color at `fade` alpha).
 * Outline first so the fill sits on top → ring effect.
 *
 * Slice degradation (the only ported C++ mode) clips the unit ellipse to a
 * left-anchored rect of half-width `sliceHalfW = max(0.05, wholeness²)` in unit
 * space; we emit it as a triangle fan over the clipped contour. When wholeness
 * is 1 the contour is the full ellipse.
 *
 * Output is interleaved [x, y, r, g, b, a] floats (VERTEX_STRIDE = 6), a flat
 * triangle list (3 verts per triangle, no indexing) so it drops straight into
 * meshBatch's vertex buffer.
 */
export function buildMoleculesMesh(
  parts: readonly Part[],
  selectedFragment: number | null,
  rolloverFragment: number | null,
  t: MeshBuildTuning,
): Mesh {
  const verts: number[] = [];

  for (const p of parts) {
    const selected = selectedFragment !== null && p.fragment === selectedFragment;
    const rollover = rolloverFragment !== null && p.fragment === rolloverFragment;

    const emit = (outline: boolean) => {
      if (outline && !selected && !rollover) return;
      const inflate = outline ? t.outlineWidth : 0;
      let color: RGB;
      if (outline) {
        color = selected && rollover ? lerp3(t.selectColor, t.hoverColor, 0.5)
              : selected             ? t.selectColor
              :                        t.hoverColor;
      } else {
        color = p.color;
      }
      emitPart(verts, p, inflate, color, p.fade, t);
    };

    emit(true);
    emit(false);
  }

  const data = new Float32Array(verts);
  return { data, vertexCount: data.length / VERTEX_STRIDE };
}

function emitPart(
  out: number[],
  p: Part,
  inflate: number,
  color: RGB,
  alpha: number,
  t: MeshBuildTuning,
): void {
  const N = t.numCirclePartVertices;
  const minR = Math.min(p.radius.x, p.radius.y);
  const locScale = (1 - t.multimerAdhereOverlapFrac) * 2;
  // Area-preserving slice fraction, floored so fully-degraded parts stay
  // visible/pickable. C++ makeDegradeIntersectShape uses wholeness² with no
  // floor; the floor mirrors the pre-M24 canvas behaviour.
  const wholeFrac = Math.max(0.05, p.wholeness * p.wholeness);
  const cosA = Math.cos(p.angle);
  const sinA = Math.sin(p.angle);

  for (const m of p.multi) {
    // Multimer slot centre in world space (radius units → px), rotated by part angle.
    const offX = m.loc.x * minR * locScale;
    const offY = m.loc.y * minR * locScale;
    const cx = p.loc.x + (offX * cosA - offY * sinA);
    const cy = p.loc.y + (offX * sinA + offY * cosA);
    const a = p.angle + m.angle;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const rx = p.radius.x + inflate;
    const ry = p.radius.y + inflate;

    // Unit-space x of the left-anchored slice's right edge. Port of C++
    // makeDegradeIntersectShape: in ellipse space the cut rect is
    //   x ∈ [-radius.x, -radius.x + 2·radius.x·wholeness² + inflate],
    // so in unit space (÷rx, with radius already inflated) the right edge is
    //   (2·wholeness² − 1) + inflate/rx.
    // The inflate term widens the outline pass's clip to match the inflated
    // outline ellipse (C++ `f.x2 += inflateRadius`).
    const sliceRight = (2 * wholeFrac - 1) + inflate / rx;

    // Build the clipped unit contour (x ∈ [-1, sliceRight]) as N points, then
    // fan from the centre. Clamping x to sliceRight folds the right arc onto a
    // vertical edge — the points keep distinct y, so the fan stays non-degenerate
    // and the result equals the ellipse ∩ {x ≤ right} that C++ calcIntersection
    // and the pre-M24 ctx.clip() produced.
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      let ux = Math.cos(th);
      const uy = Math.sin(th);
      if (ux > sliceRight) ux = sliceRight; // clip to left-anchored rect
      // unit → ellipse → rotate → translate
      const ex = ux * rx;
      const ey = uy * ry;
      pts.push([cx + (ex * ca - ey * sa), cy + (ex * sa + ey * ca)]);
    }

    // Fan centre = the clipped centroid x-bias midpoint at unit origin → ellipse.
    const c0x = cx;
    const c0y = cy;
    for (let i = 0; i < N; i++) {
      const a0 = pts[i];
      const a1 = pts[(i + 1) % N];
      pushV(out, c0x, c0y, color, alpha);
      pushV(out, a0[0], a0[1], color, alpha);
      pushV(out, a1[0], a1[1], color, alpha);
    }
  }
}

function pushV(out: number[], x: number, y: number, c: RGB, a: number): void {
  out.push(x, y, c[0], c[1], c[2], a);
}
