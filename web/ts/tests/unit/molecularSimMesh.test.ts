import { describe, it, expect } from 'vitest';
import { buildRepresentativeMesh, buildMoleculesMesh, type MeshBuildTuning } from '../../src/lib/sim/molecularSimMesh';
import type { Part } from '../../src/lib/sim/molecularSimEngine';
import { VERTEX_STRIDE } from '../../src/lib/gel/mesh';

const TUNING: MeshBuildTuning = {
  numCirclePartVertices: 32,
  multimerAdhereOverlapFrac: 0.1,
  outlineWidth: 1.5,
  selectColor: [0, 0, 0],
  hoverColor:  [1, 1, 0],
};

function monomer(over: Partial<Part> = {}): Part {
  return {
    fragment: 0,
    loc: { x: 100, y: 100 },
    vel: { x: 0, y: 0 },
    radius: { x: 10, y: 6 },
    angle: 0,
    angleVel: 0,
    color: [0.2, 0.4, 0.6],
    age: 0,
    fade: 1,
    alive: true,
    degradeKey: 0.5,
    wholeness: 1,
    multi: [{ loc: { x: 0, y: 0 }, angle: 0 }],
    ...over,
  };
}

describe('buildMoleculesMesh', () => {
  it('returns an empty mesh for no parts', () => {
    const m = buildMoleculesMesh([], null, null, TUNING);
    expect(m.vertexCount).toBe(0);
    expect(m.data.length).toBe(0);
  });

  it('a single whole monomer emits one fill fan (N triangles = 3N verts)', () => {
    const m = buildMoleculesMesh([monomer()], null, null, TUNING);
    // Triangle fan over a full circle: N triangles, 3 verts each.
    expect(m.vertexCount).toBe(TUNING.numCirclePartVertices * 3);
    expect(m.data.length).toBe(m.vertexCount * VERTEX_STRIDE);
  });

  it('fill verts carry the part color premultiplied by fade in the color slots', () => {
    const m = buildMoleculesMesh([monomer({ fade: 0.5 })], null, null, TUNING);
    // First vertex: [x, y, r, g, b, a]; a = fade.
    expect(m.data[VERTEX_STRIDE - 1]).toBeCloseTo(0.5, 5);
  });

  it('a selected monomer adds an outline pass before the fill (2× the verts)', () => {
    const fill = buildMoleculesMesh([monomer()], null, null, TUNING).vertexCount;
    const sel  = buildMoleculesMesh([monomer()], 0, null, TUNING).vertexCount;
    expect(sel).toBe(fill * 2);
  });

  it('rollover uses the hover color in the outline pass', () => {
    const m = buildMoleculesMesh([monomer()], null, 0, TUNING);
    // Outline pass is emitted first; its 2nd vertex color = hoverColor at fade=1.
    // Vertex layout per fan triangle: [center, rim_i, rim_{i+1}]; rim color = hover.
    const v1 = m.data.slice(VERTEX_STRIDE, VERTEX_STRIDE * 2);
    expect([v1[2], v1[3], v1[4]]).toEqual([1, 1, 0]);
  });

  it('zero-wholeness fill preserves native degenerate-rectangle behavior', () => {
    const m = buildMoleculesMesh([monomer({ wholeness: 0 })], null, null, TUNING);
    expect(m.vertexCount).toBeGreaterThan(0);
  });

  it('a 2-slot multimer emits twice the fill geometry of a monomer', () => {
    const one = buildMoleculesMesh([monomer()], null, null, TUNING).vertexCount;
    const two = buildMoleculesMesh(
      [monomer({ multi: [{ loc: { x: 0, y: 0 }, angle: 0 }, { loc: { x: 1, y: 0 }, angle: 0 }] })],
      null, null, TUNING,
    ).vertexCount;
    expect(two).toBe(one * 2);
  });

  it('slices to the area-preserving right edge: x ≤ loc + (2·wholeness²−1)·rx', () => {
    // C++ makeDegradeIntersectShape cuts the ellipse at unit x = 2·wholeness²−1.
    // For wholeness²=0.5 → right edge at unit x=0 → world x = loc.x = 100.
    // (Guards against the earlier bug that clipped at wholeness² instead, which
    //  would have left vertices out to x=105.)
    const m = buildMoleculesMesh(
      [monomer({ wholeness: Math.SQRT1_2 })], // wholeness² = 0.5
      null, null, TUNING,
    );
    let maxX = -Infinity;
    for (let i = 0; i < m.vertexCount; i++) maxX = Math.max(maxX, m.data[i * VERTEX_STRIDE]);
    expect(maxX).toBeCloseTo(100, 4);     // not 105
    expect(maxX).toBeLessThan(101);
  });

  it('the second multimer slot is offset by loc * minRadius * (1-overlap) * 2', () => {
    const m = buildMoleculesMesh(
      [monomer({ multi: [{ loc: { x: 0, y: 0 }, angle: 0 }, { loc: { x: 1, y: 0 }, angle: 0 }] })],
      null, null, TUNING,
    );
    const minR = 6; // min(10,6)
    const expectedDx = 1 * minR * (1 - TUNING.multimerAdhereOverlapFrac) * 2;
    // Center vertex of slot 0 fan is at part loc (100,100); slot 1 center at +dx.
    const stride = VERTEX_STRIDE;
    const slot0CenterX = m.data[0];
    const slot1CenterX = m.data[TUNING.numCirclePartVertices * 3 * stride];
    expect(slot0CenterX).toBeCloseTo(100, 4);
    expect(slot1CenterX).toBeCloseTo(100 + expectedDx, 4);
  });
});

it('all synthetic fragments sharing a selected origin receive outlines',()=>{
 const parts=[monomer({fragment:0}),monomer({fragment:1}),monomer({fragment:2})];
 const fill=buildMoleculesMesh(parts,null,null,TUNING);
 const selected=buildMoleculesMesh(parts,new Set([0,2]),null,TUNING);
 expect(selected.vertexCount).toBe(fill.vertexCount+2*TUNING.numCirclePartVertices*3);
});


describe('native representative molecule', () => {
  it('chooses greatest positive fade, keeping the first tie, and centers without an outline', () => {
    const first=monomer({fragment:2,fade:.8,color:[1,0,0],angle:.7});
    const parts=[monomer({fragment:0,fade:1}),monomer({fragment:2,fade:.2}),first,monomer({fragment:2,fade:.8,color:[0,1,0]})];
    const before=structuredClone(parts);
    const mesh=buildRepresentativeMesh(parts,2,{x:40,y:40},TUNING);
    expect(mesh).toEqual(buildMoleculesMesh([{...first,loc:{x:40,y:40}}],null,null,TUNING));
    expect(parts).toEqual(before);
  });
  it('draws no representative for an absent fragment or zero fade', () => {
    expect(buildRepresentativeMesh([monomer({fade:0})],0,{x:40,y:40},TUNING).vertexCount).toBe(0);
    expect(buildRepresentativeMesh([monomer()],2,{x:40,y:40},TUNING).vertexCount).toBe(0);
  });
});
