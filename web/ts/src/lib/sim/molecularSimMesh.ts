import { type Mesh, VERTEX_STRIDE } from '../gel/mesh';
import type { Part } from './molecularSimEngine';

export interface MeshBuildTuning {
  numCirclePartVertices: number;
  multimerAdhereOverlapFrac: number;
  outlineWidth: number;
  selectColor: readonly [number, number, number];
  hoverColor:  readonly [number, number, number];
}

export type FragmentHighlight = number | ReadonlySet<number> | null;

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
 * Slice degradation intersects the native 32-point ellipse with its cut
 * rectangle, then fans from the polygon centroid. No minimum slice is added.
 *
 * Output is interleaved [x, y, r, g, b, a] floats (VERTEX_STRIDE = 6), a flat
 * triangle list (3 verts per triangle, no indexing) so it drops straight into
 * meshBatch's vertex buffer.
 */
export function buildMoleculesMesh(
  parts: readonly Part[],
  selectedFragment: FragmentHighlight,
  rolloverFragment: FragmentHighlight,
  t: MeshBuildTuning,
): Mesh {
  const verts: number[] = [];

  for (const p of parts) {
    const selected = typeof selectedFragment === 'number' ? p.fragment === selectedFragment : selectedFragment?.has(p.fragment) ?? false;
    const rollover = typeof rolloverFragment === 'number' ? p.fragment === rolloverFragment : rolloverFragment?.has(p.fragment) ?? false;

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
  const f = Math.fround;
  const rx = f(f(p.radius.x) + inflate), ry = f(f(p.radius.y) + inflate);
  const pts: Array<[number, number]> = [];
  const delta = f(f(f(1 / t.numCirclePartVertices) * 2) * f(3.14159));
  let phase = 0;
  for (let i = 0; i < t.numCirclePartVertices; i++) {
    pts.push([f(f(Math.cos(phase)) * rx), f(f(Math.sin(phase)) * ry)]);
    phase = f(phase + delta);
  }
  let contour = pts;
  if (f(p.wholeness) < 1) {
    const whole = f(p.wholeness);
    const area = f(f(f(rx * ry) * 4) * f(whole * whole));
    const width = f(area / f(ry * 2));
    const right = f(f(-rx + width) + inflate);
    // Legacy Boost intersection treats a zero-width rectangle as degenerate
    // and returns the ellipse. Preserve this captured native behavior.
    if (right !== -rx) contour = clipRight(pts, right, rx, ry);
  }
  if (contour.length < 3) return;
  const center = centroid(contour);
  const rootC = f(Math.cos(f(p.angle))), rootS = f(Math.sin(f(p.angle)));
  for (const m of p.multi) {
    const minR = Math.min(f(p.radius.x), f(p.radius.y));
    const overlap = f(1 - f(t.multimerAdhereOverlapFrac));
    const ox = f(f(f(f(m.loc.x) * minR) * overlap) * 2);
    const oy = f(f(f(f(m.loc.y) * minR) * overlap) * 2);
    const c = f(Math.cos(f(m.angle))), s = f(Math.sin(f(m.angle)));
    const transform = ([x,y]:[number,number]):[number,number] => {
      const mx = f(f(f(c*x) - f(s*y)) + ox);
      const my = f(f(f(s*x) + f(c*y)) + oy);
      return [f(f(f(rootC*mx) - f(rootS*my)) + f(p.loc.x)),
        f(f(f(rootS*mx) + f(rootC*my)) + f(p.loc.y))];
    };
    const origin = transform(center), rim = contour.map(transform);
    for (let i=0;i<rim.length;i++) {
      const next=rim[(i+1)%rim.length];
      pushV(out,origin[0],origin[1],color,alpha);
      pushV(out,rim[i][0],rim[i][1],color,alpha);
      pushV(out,next[0],next[1],color,alpha);
    }
  }
}

function clipRight(points: Array<[number,number]>, right:number, rx:number, ry:number): Array<[number,number]> {
  // Cinder 0.9 Boost.Geometry rescales to a 10-million-unit integer range.
  // It corrects rings to clockwise, then reconstructs each crossing on the
  // segment with the smaller intersection ratio. Preserve that quantization:
  // exact floating half-plane intersections destabilize native tiny centroids.
  const extent=Math.max(2*rx,2*ry,right+rx);
  const scale=extent>=1e7?1:Math.trunc(.5+1e7/extent);
  const ix=(x:number)=>Math.trunc(-5e6+(x+rx)*scale);
  const iy=(y:number)=>Math.trunc(-5e6+(y+ry)*scale);
  const edge=ix(right),top=iy(ry),bottom=iy(-ry);
  const clockwise=[points[0],...points.slice(1).reverse()];
  const out:Array<[number,number]>=[];
  let previous=clockwise[clockwise.length-1];
  for(const current of clockwise) {
    const ax=ix(previous[0]),bx=ix(current[0]);
    const inside=bx<=edge,wasInside=ax<=edge;
    if(inside!==wasInside) {
      const numerator=edge-ax,denominator=bx-ax;
      const ay=iy(previous[1]),by=iy(current[1]);
      const bn=(top-ay)*denominator-(by-ay)*numerator;
      const bd=(top-bottom)*denominator;
      const ra=numerator/denominator,rb=bn/bd;
      if(ra<rb) out.push([
        Math.fround(previous[0]+numerator*(current[0]-previous[0])/denominator),
        Math.fround(previous[1]+numerator*(current[1]-previous[1])/denominator)]);
      else out.push([right,Math.fround(ry+bn*(-2*ry)/bd)]);
    }
    if(inside) {
      // The ellipse touches the rectangle's left edge. Boost resolves this
      // touch on that edge using its integer ratio, so retain the snapped Y.
      out.push(current[0]===-rx
        ? [-rx,Math.fround(-ry+(iy(current[1])-bottom)*(2*ry)/(top-bottom))]
        : current);
    }
    previous=current;
  }
  // Boost emits a closed ring. The repeated endpoint participates in the
  // native centroid arithmetic (including its fused-product residual).
  const left=out.findIndex(p=>p[0]===-rx);
  const ring=left<0?out:[...out.slice(left),...out.slice(0,left)];
  if(ring.length)ring.push(ring[0]);
  return ring;
}

function centroid(points:Array<[number,number]>):[number,number] {
  const f=Math.fround;
  let x=0,y=0,area=0;
  for(let i=0;i<points.length;i++) {
    const a=points[i],b=points[(i+1)%points.length];
    // The captured ARM64 native object fuses the first product/subtraction.
    // Float32 inputs have exact products in JS double precision here.
    const cross=f(a[0]*b[1]-f(b[0]*a[1]));
    x+=f(a[0]+b[0])*cross;y+=f(a[1]+b[1])*cross;area+=cross;
  }
  if (area === 0) {
    // A very thin contour can cancel in native-style float cross products.
    // Translate before accumulating in double precision to keep the fan
    // center finite and inside this convex polygon without widening the cut.
    const origin=points[0];
    x=0;y=0;area=0;
    for(let i=0;i<points.length;i++) {
      const a=[points[i][0]-origin[0],points[i][1]-origin[1]];
      const next=points[(i+1)%points.length],b=[next[0]-origin[0],next[1]-origin[1]];
      const cross=a[0]*b[1]-b[0]*a[1];
      x+=(a[0]+b[0])*cross;y+=(a[1]+b[1])*cross;area+=cross;
    }
    if(area===0)return origin;
    return [f(origin[0]+x/(area*3)),f(origin[1]+y/(area*3))];
  }
  return [f(x/(area*3)),f(y/(area*3))];
}

function pushV(out: number[], x: number, y: number, c: RGB, a: number): void {
  out.push(x, y, c[0], c[1], c[2], a);
}


/** Native drawRepresentativeOfFrag: most-visible matching part, first on ties. */
export function buildRepresentativeMesh(parts: readonly Part[], fragment: number,
  center: {x:number;y:number}, tuning: MeshBuildTuning): Mesh {
  let pick: Part | undefined;
  let fade = 0;
  for (const part of parts) {
    if (part.fragment === fragment && part.fade > fade) { pick = part; fade = part.fade; }
  }
  return buildMoleculesMesh(pick ? [{...pick, loc: center}] : [], null, null, tuning);
}
