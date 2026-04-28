import type { Band } from '../sim/band';

export interface Mesh {
  data: Float32Array;        // [x, y, r, g, b, a] per vertex
  vertexCount: number;
}

export const VERTEX_STRIDE = 6;  // floats per vertex

function emitQuad(
  out: number[],
  x1: number, y1: number, x2: number, y2: number,
  cTopL: [number, number, number, number],
  cTopR: [number, number, number, number],
  cBotR: [number, number, number, number],
  cBotL: [number, number, number, number]
) {
  // Match C++ TriMesh winding: tri (2,1,0) + tri (0,3,2)
  // Where: 0=upper-left, 1=upper-right, 2=lower-right, 3=lower-left
  // Triangle 1: lower-right, upper-right, upper-left
  out.push(x2, y2, ...cBotR);
  out.push(x2, y1, ...cTopR);
  out.push(x1, y1, ...cTopL);
  // Triangle 2: upper-left, lower-left, lower-right
  out.push(x1, y1, ...cTopL);
  out.push(x1, y2, ...cBotL);
  out.push(x2, y2, ...cBotR);
}

export function buildSmearMesh(band: Band): Mesh {
  const out: number[] = [];
  const { rect, smearAbove, smearBelow, smearBrightnessAbove, smearBrightnessBelow } = band;

  // Above smear (direction = -1): rect from y1-thickness to y1
  if (smearAbove > 0) {
    const [bClose, bFar] = smearBrightnessAbove;
    const cClose: [number, number, number, number] = [bClose, bClose, bClose, 1];
    const cFar:   [number, number, number, number] = [bFar,   bFar,   bFar,   1];
    // C++: above → top=cfar, bottom=cclose (vertex order 0,1=cfar; 2,3=cclose)
    emitQuad(
      out,
      rect.x1, rect.y1 - smearAbove, rect.x2, rect.y1,
      cFar, cFar, cClose, cClose
    );
  }

  // Below smear (direction = +1): rect from y2 to y2+thickness
  if (smearBelow > 0) {
    const [bClose, bFar] = smearBrightnessBelow;
    const cClose: [number, number, number, number] = [bClose, bClose, bClose, 1];
    const cFar:   [number, number, number, number] = [bFar,   bFar,   bFar,   1];
    // C++: below → top=cclose, bottom=cfar (vertex order 0,1=cclose; 2,3=cfar)
    emitQuad(
      out,
      rect.x1, rect.y2, rect.x2, rect.y2 + smearBelow,
      cClose, cClose, cFar, cFar
    );
  }

  return { data: new Float32Array(out), vertexCount: out.length / VERTEX_STRIDE };
}
