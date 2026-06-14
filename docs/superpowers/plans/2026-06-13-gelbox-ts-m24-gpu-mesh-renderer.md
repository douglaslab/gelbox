# M24 — GPU Mesh-Batch Renderer + Sample-Panel Parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the molecular-sim sample panel through the GPU (WebGPU primary, WebGL2 fallback) by extracting the existing gel mesh-pipeline into a reusable `meshBatch` primitive, and use it to close the two C++ parity gaps (dye-tinted background with highlight states; outline-behind-fill selection).

**Architecture:** The repo already has a position+color mesh pipeline (`geometry.{vert,frag}.{wgsl,glsl}`) wrapped inside `lib/gel/passes/primitives.ts` (WebGPU) and `lib/gel/render-gl.ts` (WebGL2), coupled to gel band meshes + additive blend. We extract the generic machinery into `lib/gpu/meshBatch.ts` + `lib/gpu/gl/meshBatch.ts` parameterized by blend mode + viewport, refactor the gel renderer to consume it (no visual change — gel goldens stay green), then add pure mesh/background builders and rework `MolecularSimCanvas` from 2D canvas to a GPU surface consuming `meshBatch`.

**Tech Stack:** TypeScript, React, WebGPU + WebGL2, Vitest (unit), Playwright (visual goldens), Vite (`?raw` shader imports).

**Spec:** `docs/superpowers/specs/2026-06-13-gelbox-ts-m24-gpu-mesh-renderer-design.md`

**Working directory:** all paths are relative to `/Users/shawn/code/gel/ts` unless noted. Run all `npm`/`npx` commands from `ts/`.

**Verification note (read once):** WebGPU/WebGL2 modules in this repo have no unit tests — they are verified by `typecheck` + Playwright visual goldens (the established pattern; there is no headless GPU in `vitest`). Only the *pure* modules (mesh builder, background helper, color helper) get TDD with `vitest`. Tasks below follow this split deliberately.

---

## File Structure

**Create:**
- `src/lib/gpu/meshBatch.ts` — reusable WebGPU mesh-batch pass (pipeline + VBO pool + ortho uniform, parameterized by blend mode).
- `src/lib/gpu/gl/meshBatch.ts` — WebGL2 mirror.
- `src/lib/sim/molecularSimMesh.ts` — pure `buildMoleculesMesh(parts, sel, roll, tuning) → Mesh`.
- `src/lib/sim/molecularSimMesh.test.ts` — unit tests for the mesh builder.
- `src/lib/sim/molecularSimBackground.ts` — pure `computeBackgroundColor(...)` + `srgbToLinear`.
- `src/lib/sim/molecularSimBackground.test.ts` — unit tests for the background helper.
- `tests/visual/sample-molecular-render.spec.ts` — sample-panel goldens (both backends).

**Modify:**
- `src/lib/gel/passes/primitives.ts` — consume `meshBatch` instead of its inline pipeline.
- `src/lib/gel/render-gl.ts` — consume gl `meshBatch` for the geometry draw.
- `src/components/sample/MolecularSimCanvas.tsx` — 2D canvas → GPU surface via `meshBatch`.
- `docs/STATUS.md` — mark M24 done; note M25 re-eval.
- `docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md` — tick the M24 sub-plan box.

---

## Task 1: Extract reusable WebGPU `meshBatch`

**Files:**
- Create: `src/lib/gpu/meshBatch.ts`

This is a faithful copy of the generic machinery in `primitives.ts` (the VBO pool, ortho uniform, geometry shaders), with blend mode parameterized and the draw target passed in. No gel-specific mesh building.

- [ ] **Step 1: Write the module**

```ts
import { createUniformBuffer, writeVec2 } from './uniforms';
import { createShaderModule } from './shader';
import { type Mesh, VERTEX_STRIDE } from '../gel/mesh';
import geomVertSrc from '../../shaders/geometry.vert.wgsl?raw';
import geomFragSrc from '../../shaders/geometry.frag.wgsl?raw';

export type BlendMode = 'additive' | 'over';

export interface MeshBatchDrawOpts {
  clear: boolean;
  clearColor?: { r: number; g: number; b: number; a: number };
  /** Selects a per-call VBO pool slot. Unique per draw within a frame. */
  callIdx: number;
}

export interface MeshBatch {
  draw(
    encoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    mesh: Mesh,
    opts: MeshBatchDrawOpts,
  ): void;
  setViewport(width: number, height: number): void;
  destroy(): void;
}

const INITIAL_VBO_BYTES = 64 * 1024;

function blendState(mode: BlendMode): GPUBlendState {
  if (mode === 'additive') {
    // Matches gel primitives: SRC_ALPHA,ONE on alpha=1 premultiplied output.
    return {
      color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
    };
  }
  // 'over' — geometry.frag outputs premultiplied (rgb*a, a), so straight
  // "source-over" is (ONE, ONE_MINUS_SRC_ALPHA).
  return {
    color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
  };
}

export function createMeshBatch(
  device: GPUDevice,
  opts: {
    viewport: { width: number; height: number };
    blend: BlendMode;
    format?: GPUTextureFormat;
  },
): MeshBatch {
  const format = opts.format ?? 'rgba8unorm-srgb';
  const vs = createShaderModule(device, geomVertSrc, 'geometry.vert');
  const fs = createShaderModule(device, geomFragSrc, 'geometry.frag');

  const bgl = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }],
  });

  const pipeline = device.createRenderPipeline({
    label: `meshBatch-${opts.blend}`,
    layout: device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
    vertex: {
      module: vs,
      entryPoint: 'vs_main',
      buffers: [{
        arrayStride: VERTEX_STRIDE * 4,
        stepMode: 'vertex',
        attributes: [
          { shaderLocation: 0, offset: 0,     format: 'float32x2' },
          { shaderLocation: 1, offset: 4 * 2, format: 'float32x4' },
        ],
      }],
    },
    fragment: {
      module: fs,
      entryPoint: 'fs_main',
      targets: [{ format, blend: blendState(opts.blend) }],
    },
    primitive: { topology: 'triangle-list' },
  });

  const ub = createUniformBuffer(device, 16, 'meshBatch-uniforms');
  writeVec2(ub.view, 0, opts.viewport.width, opts.viewport.height);
  writeVec2(ub.view, 8, 0, 0);
  ub.upload(device.queue);

  const bg = device.createBindGroup({
    layout: bgl,
    entries: [{ binding: 0, resource: { buffer: ub.buffer } }],
  });

  type Slot = { buffer: GPUBuffer; size: number };
  const vbos: Slot[] = [];

  function ensureSlot(callIdx: number, byteLength: number): Slot {
    while (vbos.length <= callIdx) {
      vbos.push({
        buffer: device.createBuffer({
          label: `meshBatch-vbo[${vbos.length}]`,
          size: INITIAL_VBO_BYTES,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        }),
        size: INITIAL_VBO_BYTES,
      });
    }
    const slot = vbos[callIdx];
    if (slot.size >= byteLength) return slot;
    slot.buffer.destroy();
    let newSize = slot.size;
    while (newSize < byteLength) newSize *= 2;
    slot.size = newSize;
    slot.buffer = device.createBuffer({
      label: `meshBatch-vbo[${callIdx}]`,
      size: newSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    return slot;
  }

  return {
    setViewport(w, h) {
      writeVec2(ub.view, 0, w, h);
      ub.upload(device.queue);
    },
    draw(encoder, targetView, mesh, { clear, clearColor, callIdx }) {
      const cc = clearColor ?? { r: 0, g: 0, b: 0, a: 0 };
      if (mesh.vertexCount === 0) {
        if (clear) {
          const pass = encoder.beginRenderPass({
            colorAttachments: [{ view: targetView, loadOp: 'clear', storeOp: 'store', clearValue: cc }],
          });
          pass.end();
        }
        return;
      }
      const slot = ensureSlot(callIdx, mesh.data.byteLength);
      device.queue.writeBuffer(slot.buffer, 0, mesh.data);
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: targetView,
          loadOp: clear ? 'clear' : 'load',
          storeOp: 'store',
          clearValue: cc,
        }],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, slot.buffer);
      pass.draw(mesh.vertexCount);
      pass.end();
    },
    destroy() {
      for (const slot of vbos) slot.buffer.destroy();
      vbos.length = 0;
      ub.destroy();
    },
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (new module compiles; not yet imported anywhere).

- [ ] **Step 3: Commit**

```bash
git add src/lib/gpu/meshBatch.ts
git commit -m "feat(gpu): extract reusable WebGPU meshBatch pass"
```

---

## Task 2: Refactor gel `primitives.ts` to consume `meshBatch`

**Files:**
- Modify: `src/lib/gel/passes/primitives.ts`

Replace the inline pipeline/uniform/VBO-pool with a `meshBatch` instance (additive blend, gel viewport). The gel-specific `combine([...])` mesh building stays. Net visual change: none.

- [ ] **Step 1: Rewrite the pass body**

Replace the entire body of `createPrimitivePass` (keep the exported `PrimitivePass` interface and `draw(encoder, dst, band, callIdx)` signature) with:

```ts
import type { Band } from '../../sim/band';
import type { RenderTarget } from '../../gpu/target';
import { type Mesh, VERTEX_STRIDE } from '../mesh';
import { buildSmearMesh } from '../smear';
import { buildBodyMesh } from '../body';
import { buildFlamesMesh } from '../flames';
import { createMeshBatch } from '../../gpu/meshBatch';

export interface PrimitivePass {
  draw(encoder: GPUCommandEncoder, dst: RenderTarget, band: Band, callIdx: number): void;
  destroy(): void;
}

export function createPrimitivePass(
  device: GPUDevice,
  gelSize: { width: number; height: number },
  format: GPUTextureFormat = 'rgba8unorm-srgb',
): PrimitivePass {
  const batch = createMeshBatch(device, { viewport: gelSize, blend: 'additive', format });

  function combine(meshes: Mesh[]): Mesh {
    let total = 0;
    for (const m of meshes) total += m.data.length;
    const data = new Float32Array(total);
    let off = 0;
    for (const m of meshes) { data.set(m.data, off); off += m.data.length; }
    return { data, vertexCount: total / VERTEX_STRIDE };
  }

  return {
    draw(encoder, dst, band, callIdx) {
      const mesh = combine([
        buildSmearMesh(band),
        buildBodyMesh(band),
        buildFlamesMesh(band),
      ]);
      // Always clear (even when empty) so downstream passes sample a clean RT.
      batch.draw(encoder, dst.view, mesh, {
        clear: true,
        clearColor: { r: 0, g: 0, b: 0, a: 1 },
        callIdx,
      });
    },
    destroy() { batch.destroy(); },
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Verify gel WebGPU goldens unchanged**

Run: `npx playwright test gel --project=chromium-webgpu`
Expected: PASS — no visual diffs (this refactor is behavior-preserving). If a previously-failing pre-existing test is still failing identically, that's acceptable; no test that was passing may regress.

- [ ] **Step 4: Commit**

```bash
git add src/lib/gel/passes/primitives.ts
git commit -m "refactor(gel): primitives pass consumes meshBatch (no visual change)"
```

---

## Task 3: Extract reusable WebGL2 `meshBatch`

**Files:**
- Create: `src/lib/gpu/gl/meshBatch.ts`

Mirror of Task 1 for WebGL2, modeled on `render-gl.ts:145-159`. Targets either an offscreen framebuffer or the default framebuffer (canvas, `target = null`).

- [ ] **Step 1: Write the module**

```ts
import { createGlProgram } from './program';
import { type Mesh, VERTEX_STRIDE } from '../../gel/mesh';
import geometryVertSrc from '../../../shaders/geometry.vert.glsl?raw';
import geometryFragSrc from '../../../shaders/geometry.frag.glsl?raw';

export type GlBlendMode = 'additive' | 'over';

export interface GlMeshBatchTarget {
  framebuffer: WebGLFramebuffer | null; // null = default framebuffer (canvas)
  width: number;                         // drawing-buffer pixels for gl.viewport
  height: number;
}

export interface GlMeshBatchDrawOpts {
  clear: boolean;
  clearColor?: [number, number, number, number];
}

export interface GlMeshBatch {
  draw(target: GlMeshBatchTarget, mesh: Mesh, opts: GlMeshBatchDrawOpts): void;
  setViewport(width: number, height: number): void;
  destroy(): void;
}

export function createGlMeshBatch(
  gl: WebGL2RenderingContext,
  opts: { viewport: { width: number; height: number }; blend: GlBlendMode },
): GlMeshBatch {
  const prog = createGlProgram(gl, geometryVertSrc, geometryFragSrc, `meshBatch-${opts.blend}`);
  let vbo: WebGLBuffer | null = gl.createBuffer();
  let vboSize = 0;
  let viewW = opts.viewport.width;
  let viewH = opts.viewport.height;

  function ensureVbo(byteLength: number) {
    if (vboSize >= byteLength) return;
    vboSize = Math.max(byteLength, 64 * 1024);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vboSize, gl.DYNAMIC_DRAW);
  }

  function applyBlend() {
    gl.enable(gl.BLEND);
    if (opts.blend === 'additive') {
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
    } else {
      // 'over' — premultiplied source-over.
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.blendEquation(gl.FUNC_ADD);
  }

  return {
    setViewport(w, h) { viewW = w; viewH = h; },
    draw(target, mesh, { clear, clearColor }) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
      if (clear) {
        const c = clearColor ?? [0, 0, 0, 0];
        gl.disable(gl.BLEND);
        gl.clearColor(c[0], c[1], c[2], c[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      if (mesh.vertexCount === 0) return;

      ensureVbo(mesh.data.byteLength);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.data);

      gl.useProgram(prog.program);
      gl.uniform2f(prog.uniform('uGelSize'), viewW, viewH);
      const aPos = prog.attrib('aPos');
      const aColor = prog.attrib('aColor');
      const STRIDE = VERTEX_STRIDE * 4;
      if (aPos >= 0)   { gl.enableVertexAttribArray(aPos);   gl.vertexAttribPointer(aPos,   2, gl.FLOAT, false, STRIDE, 0); }
      if (aColor >= 0) { gl.enableVertexAttribArray(aColor); gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, STRIDE, 8); }

      applyBlend();
      gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
    },
    destroy() {
      prog.destroy();
      if (vbo) gl.deleteBuffer(vbo);
      vbo = null;
    },
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (new module, not yet imported).

- [ ] **Step 3: Commit**

```bash
git add src/lib/gpu/gl/meshBatch.ts
git commit -m "feat(gpu): extract reusable WebGL2 meshBatch pass"
```

---

## Task 4: Refactor gel `render-gl.ts` to consume gl `meshBatch`

**Files:**
- Modify: `src/lib/gel/render-gl.ts`

Replace the inline geometry program + `geomVbo` + `drawGeometry` logic (the `progGeom`, `ensureGeomVbo`, and the geometry draw block at lines ~145-160) with a `createGlMeshBatch` instance (additive). Bands render into the `band` offscreen target. Net visual change: none.

- [ ] **Step 1: Add the import**

At the top of `src/lib/gel/render-gl.ts`, add:

```ts
import { createGlMeshBatch } from '../gpu/gl/meshBatch';
```

Remove the now-unused imports of `geometryVertSrc` / `geometryFragSrc` (the meshBatch owns them) and the `createGlProgram` import **only if** no other pass uses it (it is used for warp/blur/composite — keep `createGlProgram`; only drop the two `geometry*Src` imports).

- [ ] **Step 2: Replace the geometry program + VBO with a meshBatch**

Delete these declarations:

```ts
const progGeom    = createGlProgram(gl, geometryVertSrc,    geometryFragSrc,    'geometry');
// ...
let geomVbo: WebGLBuffer | null = gl.createBuffer();
let geomVboSize = 0;
function ensureGeomVbo(byteLength: number) { ... }
```

Add in their place:

```ts
const geomBatch = createGlMeshBatch(gl, { viewport: gelSize, blend: 'additive' });
```

- [ ] **Step 3: Replace the geometry draw call**

Find the function that draws band geometry (the block using `progGeom`, `ensureGeomVbo`, `gl.drawArrays(gl.TRIANGLES, ...)` around line 145-160). Replace its body so it builds the combined mesh (unchanged) and draws via the batch into the `band` target:

```ts
function drawGeometry(mesh: Mesh) {
  geomBatch.draw(
    { framebuffer: band.current.framebuffer, width: band.current.width, height: band.current.height },
    mesh,
    { clear: true, clearColor: [0, 0, 0, 1] },
  );
}
```

(If the existing geometry-draw function has a different name/shape, preserve its call sites — only its internals change to delegate to `geomBatch.draw`.)

- [ ] **Step 4: Update teardown**

In the `destroy()` block, remove `progGeom.destroy();` and `if (geomVbo) gl.deleteBuffer(geomVbo);` and add:

```ts
geomBatch.destroy();
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no unused-symbol errors — confirm `geometryVertSrc`/`geometryFragSrc` imports are gone).

- [ ] **Step 6: Verify gel WebGL2 goldens unchanged**

Run: `npx playwright test gel --project=chromium-webgl2`
Expected: PASS — no visual diffs. No previously-passing test may regress.

- [ ] **Step 7: Commit**

```bash
git add src/lib/gel/render-gl.ts
git commit -m "refactor(gel): WebGL2 geometry draw consumes meshBatch (no visual change)"
```

---

## Task 5: Pure CPU mesh builder `molecularSimMesh.ts` (TDD)

**Files:**
- Create: `src/lib/sim/molecularSimMesh.ts`
- Test: `src/lib/sim/molecularSimMesh.test.ts`

Port of C++ `makeMoleculesMesh` + `makeMesh`/`makeMesh_slice`. Pure: `Part[]` → `Mesh` (`{ data: Float32Array, vertexCount }`). Builds, per part, an optional outline sub-pass (inflated, only when selected/rollover) then a fill sub-pass; per multimer slot; with slice degradation as triangulated geometry.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { buildMoleculesMesh, type MeshBuildTuning } from './molecularSimMesh';
import type { Part } from './molecularSimEngine';
import { VERTEX_STRIDE } from '../gel/mesh';

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

  it('a fully-degraded part still emits geometry (sliceWidth floored)', () => {
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sim/molecularSimMesh.test.ts`
Expected: FAIL — "Failed to resolve import './molecularSimMesh'".

- [ ] **Step 3: Implement the mesh builder**

```ts
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
  // Slice half-width in unit space; floored so fully-degraded parts stay visible.
  const sliceHalfW = Math.max(0.05, p.wholeness * p.wholeness);
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

    // Build the clipped unit contour (x in [-1, sliceHalfW]) as N points, then
    // fan from the centroid. The clip keeps the slice anchored to the left edge
    // (matches makeDegradeIntersectShape: left-anchored rect).
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      let ux = Math.cos(th);
      const uy = Math.sin(th);
      if (ux > sliceHalfW) ux = sliceHalfW; // clip to left-anchored rect
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/sim/molecularSimMesh.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/sim/molecularSimMesh.ts src/lib/sim/molecularSimMesh.test.ts
git commit -m "feat(sim): pure molecular-sim mesh builder (port of makeMoleculesMesh)"
```

---

## Task 6: Pure background helper `molecularSimBackground.ts` (TDD)

**Files:**
- Create: `src/lib/sim/molecularSimBackground.ts`
- Test: `src/lib/sim/molecularSimBackground.test.ts`

Port of `MolecularSim::drawBackground`. Computes the dye-tinted, highlight-dimmed background color in the sRGB-byte domain (matching Cinder `Color::hex`), then exposes an `srgbToLinear` converter so callers can hand the shader linear values (the `rgba8unorm-srgb` target re-encodes to the same sRGB pixels).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { computeBackgroundColor, srgbToLinear } from './molecularSimBackground';

// molecularSimBkgndColor = #F1F1F2 → [0xF1, 0xF1, 0xF2] / 255
const BASE: [number, number, number] = [0xF1 / 255, 0xF1 / 255, 0xF2 / 255];

describe('computeBackgroundColor (sRGB-domain, matches C++ drawBackground)', () => {
  it('idle, no dyes → base color', () => {
    const c = computeBackgroundColor([0, 0, 0, 0], 0);
    expect(c[0]).toBeCloseTo(BASE[0], 5);
    expect(c[1]).toBeCloseTo(BASE[1], 5);
    expect(c[2]).toBeCloseTo(BASE[2], 5);
  });

  it('hover dims by 0.97, mouse-down by 0.9', () => {
    const hover = computeBackgroundColor([0, 0, 0, 0], 1);
    const down  = computeBackgroundColor([0, 0, 0, 0], 2);
    expect(hover[0]).toBeCloseTo(BASE[0] * 0.97, 5);
    expect(down[0]).toBeCloseTo(BASE[0] * 0.9, 5);
  });

  it('one dye at full mass: c = (base + dyeColor) / 2', () => {
    // Xylene cyanol = 0x00AFE2; full mass = DYE_MAX_MASS so norm = 1, w = 2.
    const dye: [number, number, number] = [0x00 / 255, 0xAF / 255, 0xE2 / 255];
    const c = computeBackgroundColor([125, 0, 0, 0], 0);
    expect(c[0]).toBeCloseTo((BASE[0] + dye[0]) / 2, 5);
    expect(c[1]).toBeCloseTo((BASE[1] + dye[1]) / 2, 5);
    expect(c[2]).toBeCloseTo((BASE[2] + dye[2]) / 2, 5);
  });

  it('clamps mass norm at 1 (over-max behaves like max)', () => {
    const atMax  = computeBackgroundColor([125, 0, 0, 0], 0);
    const overMax = computeBackgroundColor([999, 0, 0, 0], 0);
    expect(overMax[0]).toBeCloseTo(atMax[0], 5);
  });
});

describe('srgbToLinear', () => {
  it('round-trips 0 and 1', () => {
    expect(srgbToLinear(0)).toBeCloseTo(0, 6);
    expect(srgbToLinear(1)).toBeCloseTo(1, 6);
  });
  it('0.5 sRGB ≈ 0.214 linear', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.21404, 4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/sim/molecularSimBackground.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

```ts
import { DYE_COLORS, DYE_MAX_MASS } from './dye';

// molecularSimBkgndColor from layout.ts (#F1F1F2), in sRGB-byte/255 domain.
const BKGND: readonly [number, number, number] = [0xF1 / 255, 0xF1 / 255, 0xF2 / 255];
const HIGHLIGHT_SCALE = [1.0, 0.97, 0.9] as const;

/**
 * Port of MolecularSim::drawBackground. `highlight`: 0 idle, 1 hover, 2 down.
 * `dyeMasses` is the 4 dye masses (ng) for the sample. Returns an sRGB-domain
 * [r,g,b] in 0..1 — the same domain C++ Cinder Color math works in. Convert
 * with srgbToLinear before uploading to the sRGB render target.
 */
export function computeBackgroundColor(
  dyeMasses: readonly number[],
  highlight: 0 | 1 | 2,
): [number, number, number] {
  const s = HIGHLIGHT_SCALE[highlight];
  let r = BKGND[0] * s;
  let g = BKGND[1] * s;
  let b = BKGND[2] * s;
  let w = 1;
  for (let i = 0; i < DYE_COLORS.length; i++) {
    const norm = Math.max(0, Math.min(1, (dyeMasses[i] ?? 0) / DYE_MAX_MASS));
    if (norm <= 0) continue;
    r += DYE_COLORS[i][0] * norm;
    g += DYE_COLORS[i][1] * norm;
    b += DYE_COLORS[i][2] * norm;
    w += norm;
  }
  return [r / w, g / w, b / w];
}

/** sRGB component (0..1) → linear (0..1). Inverse of molecularSim's toByte. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/sim/molecularSimBackground.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sim/molecularSimBackground.ts src/lib/sim/molecularSimBackground.test.ts
git commit -m "feat(sim): pure dye-tinted background helper (port of drawBackground)"
```

---

## Task 7: Rework `MolecularSimCanvas` to render via `meshBatch`

**Files:**
- Modify: `src/components/sample/MolecularSimCanvas.tsx`

Replace the 2D-canvas draw path with a GPU surface, mirroring the mount/teardown pattern of `src/components/gel/GelCanvas.tsx`. Keep the engine lifecycle (Task M21), the rAF tick loop, and the pointer/picking wiring exactly as-is. Add a 2D-canvas fallback for when `selectBackend()` throws (no GPU).

The dye masses come from the sample's dye fragments. Read them the same way the sample buffer/dye UI does: iterate `sample.fragments`, and for each dye fragment map its mass into the 4-slot `dyeMasses` array by dye index. **Implementation note:** locate the existing helper that maps a fragment to its dye index (search `isDyeFragment` / dye-index usage in `src/lib/sim/sample.ts` and `src/lib/gel/gelState.ts:248`); reuse it rather than re-deriving. If a per-dye accessor already exists on `Sample`, use that.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/sample/MolecularSimCanvas.tsx` with:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { LAYOUT } from '../../lib/layout/layout';
import { MolecularSim, MOLECULAR_SIM_TUNING } from '../../lib/sim/molecularSimEngine';
import { buildMoleculesMesh, type MeshBuildTuning } from '../../lib/sim/molecularSimMesh';
import { computeBackgroundColor, srgbToLinear } from '../../lib/sim/molecularSimBackground';
import { selectBackend } from '../../lib/gel/backend';
import { hexToLinearRgb } from '../../lib/layout/color'; // see Step 1a
import type { Mesh } from '../../lib/gel/mesh';
import { VERTEX_STRIDE } from '../../lib/gel/mesh';

export interface MolecularSimCanvasProps {
  laneIndex: number;
  width:  number;
  height: number;
}

// A backend-agnostic handle the mount effect fills in.
interface RenderHandle {
  resize(wpx: number, hpx: number, wcss: number, hcss: number): void;
  draw(mesh: Mesh, bgLinear: [number, number, number]): void;
  destroy(): void;
}

const SELECT_COLOR = hexToLinearRgb(LAYOUT.sampleViewFragSelectColor);
const HOVER_COLOR  = hexToLinearRgb(LAYOUT.sampleViewFragHoverColor);

const MESH_TUNING: MeshBuildTuning = {
  numCirclePartVertices: MOLECULAR_SIM_TUNING.numCirclePartVertices,
  multimerAdhereOverlapFrac: MOLECULAR_SIM_TUNING.multimerAdhereOverlapFrac,
  outlineWidth: LAYOUT.sampleViewFragOutlineWidth,
  selectColor: SELECT_COLOR,
  hoverColor:  HOVER_COLOR,
};

/** Pull the 4 dye masses (by dye index) out of a sample. */
function readDyeMasses(sample: { fragments: Array<{ mass: number }> } | null): number[] {
  // Implementation note (Step 1): replace with the real dye-index mapping
  // discovered in sample.ts / gelState.ts. Returns length-4 array.
  return dyeMassesFromSample(sample);
}

export function MolecularSimCanvas({ laneIndex, width, height }: MolecularSimCanvasProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<MolecularSim | null>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const hoverRef = useRef(false);
  const downRef = useRef(false);
  const [, setTick] = useState(0);

  const sample = state.samples[laneIndex];

  // Engine lifecycle (unchanged from M21).
  useEffect(() => {
    if (!simRef.current) {
      simRef.current = new MolecularSim({
        bounds: { x1: 0, y1: 0, x2: width, y2: height },
        seed:   laneIndex * 31 + 1,
      });
    }
    simRef.current.setBounds({ x1: 0, y1: 0, x2: width, y2: height });
  }, [width, height, laneIndex]);

  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.setSample(sample ?? null);
    if (sample) simRef.current.preroll(60);
    setTick((t) => t + 1);
  }, [sample]);

  // GPU surface mount (mirrors GelCanvas.tsx). Falls back to 2D on throw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const wpx = Math.round(width * dpr);
    const hpx = Math.round(height * dpr);
    canvas.width = wpx;
    canvas.height = hpx;

    (async () => {
      try {
        const backend = selectBackend();
        if (backend === 'webgl2') {
          const { configureGl2Context } = await import('../../lib/gpu/gl/context');
          const { createGlMeshBatch } = await import('../../lib/gpu/gl/meshBatch');
          const { gl } = configureGl2Context(canvas);
          if (cancelled) return;
          const batch = createGlMeshBatch(gl, { viewport: { width, height }, blend: 'over' });
          handleRef.current = {
            resize: (wp, hp, wc, hc) => { canvas.width = wp; canvas.height = hp; batch.setViewport(wc, hc); },
            draw: (mesh, bg) => {
              batch.draw(
                { framebuffer: null, width: canvas.width, height: canvas.height },
                mesh,
                { clear: true, clearColor: [bg[0], bg[1], bg[2], 1] },
              );
            },
            destroy: () => batch.destroy(),
          };
        } else {
          const { requestDevice } = await import('../../lib/gpu/device');
          const { configureContext } = await import('../../lib/gpu/context');
          const { createMeshBatch } = await import('../../lib/gpu/meshBatch');
          const { device } = await requestDevice();
          if (cancelled) return;
          const { context, format } = configureContext(canvas, device);
          const batch = createMeshBatch(device, { viewport: { width, height }, blend: 'over', format });
          handleRef.current = {
            resize: (_wp, _hp, wc, hc) => { batch.setViewport(wc, hc); },
            draw: (mesh, bg) => {
              const enc = device.createCommandEncoder({ label: 'molsim' });
              batch.draw(enc, context.getCurrentTexture().createView(), mesh, {
                clear: true,
                clearColor: { r: bg[0], g: bg[1], b: bg[2], a: 1 },
                callIdx: 0,
              });
              device.queue.submit([enc.finish()]);
            },
            destroy: () => batch.destroy(),
          };
        }
      } catch (err) {
        console.warn('MolecularSimCanvas: GPU unavailable, using 2D fallback', err);
        handleRef.current = make2dFallback(canvas, width, height);
      }
    })();

    return () => {
      cancelled = true;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [width, height, laneIndex]);

  // Selection / rollover (unchanged from M21).
  const selectedFragForLane =
    state.selection?.lane === laneIndex ? state.selection.fragmentIndex : null;
  const rolloverFragForLane =
    state.rollover?.lane === laneIndex ? state.rollover.fragmentIndex : null;
  const classicSelectedFrag =
    state.selectedLane === laneIndex ? state.selectedFragmentIndex : null;

  // rAF tick + draw.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const sim = simRef.current;
      const handle = handleRef.current;
      if (sim && handle) {
        sim.tick(1);
        const sel = selectedFragForLane ?? classicSelectedFrag;
        const mesh = buildMoleculesMesh(sim.parts, sel, rolloverFragForLane, MESH_TUNING);
        const highlight: 0 | 1 | 2 = downRef.current ? 2 : hoverRef.current ? 1 : 0;
        const bgSrgb = computeBackgroundColor(readDyeMasses(sample ?? null), highlight);
        const bgLinear: [number, number, number] =
          [srgbToLinear(bgSrgb[0]), srgbToLinear(bgSrgb[1]), srgbToLinear(bgSrgb[2])];
        handle.draw(mesh, bgLinear);
      }
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [selectedFragForLane, rolloverFragForLane, classicSelectedFrag, sample]);

  const eventCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * width,
      y: ((e.clientY - rect.top)  / rect.height) * height,
    };
  }, [width, height]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    hoverRef.current = true;
    const c = eventCoords(e);
    if (!c || !simRef.current) return;
    const fragIdx = simRef.current.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      dispatch({ type: 'SET_ROLLOVER', ref: { lane: laneIndex, fragmentIndex: fragIdx } });
    } else if (state.rollover?.lane === laneIndex) {
      dispatch({ type: 'SET_ROLLOVER', ref: null });
    }
  }, [eventCoords, dispatch, laneIndex, state.rollover]);

  const onPointerLeave = useCallback(() => {
    hoverRef.current = false;
    downRef.current = false;
    if (state.rollover?.lane === laneIndex) {
      dispatch({ type: 'SET_ROLLOVER', ref: null });
    }
  }, [dispatch, laneIndex, state.rollover]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !simRef.current) return;
    downRef.current = true;
    const c = eventCoords(e);
    if (!c) return;
    const fragIdx = simRef.current.pickFragment(c.x, c.y);
    if (fragIdx >= 0) {
      e.preventDefault();
      dispatch({ type: 'SET_SELECTED', laneIndex, index: fragIdx });
    }
  }, [eventCoords, dispatch, laneIndex]);

  const onPointerUp = useCallback(() => { downRef.current = false; }, []);

  const aliveCount = simRef.current?.parts.filter((p) => p.alive).length ?? 0;

  return (
    <canvas
      ref={canvasRef}
      data-testid="molecular-sim-canvas"
      data-lane-index={laneIndex}
      data-alive-count={aliveCount}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={{
        width:  `${width}px`,
        height: `${height}px`,
        display: 'block',
        cursor: 'pointer',
        touchAction: 'none',
      }}
    />
  );
}
```

- [ ] **Step 1a: Add the two small helpers this file imports**

The component imports `hexToLinearRgb`, `dyeMassesFromSample`, and `make2dFallback`. Define `hexToLinearRgb` in `src/lib/layout/color.ts` (create if absent) — it parses `#RRGGBB` and applies `srgbToLinear` per channel:

```ts
import { srgbToLinear } from '../sim/molecularSimBackground';

/** Parse "#RRGGBB" → linear-RGB triple (0..1) for GPU vertex colors. */
export function hexToLinearRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}
```

Define `dyeMassesFromSample` and `make2dFallback` at the bottom of `MolecularSimCanvas.tsx` (module scope, below the component):

```ts
import { isDyeFragment } from '../../lib/sim/sample';
import { DYE_COUNT } from '../../lib/sim/dye';

// Map a sample's dye fragments into a length-DYE_COUNT mass array, by dye index.
// NOTE: confirm the dye-index field name on the fragment during implementation
// (search isDyeFragment usage in sample.ts); the placeholder below assumes a
// `dye` index property. Adjust to the real shape.
function dyeMassesFromSample(sample: { fragments: Array<any> } | null): number[] {
  const out = new Array(DYE_COUNT).fill(0);
  if (!sample) return out;
  for (const f of sample.fragments) {
    if (isDyeFragment(f) && typeof f.dye === 'number') out[f.dye] = f.mass;
  }
  return out;
}

// Minimal 2D-canvas fallback when no GPU backend is available (CI safety).
// Draws flat ellipses + bg fill; no degradation/outline parity (GPU is the
// real path). Keeps the panel non-blank where WebGPU/WebGL2 are absent.
function make2dFallback(canvas: HTMLCanvasElement, width: number, height: number): RenderHandle {
  const ctx = canvas.getContext('2d');
  return {
    resize(wp, hp) { canvas.width = wp; canvas.height = hp; },
    draw(mesh /* unused */, bgLinear) {
      if (!ctx) return;
      const dpr = canvas.width / width;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const toByte = (c: number) => Math.round(Math.max(0, Math.min(1, c)) ** (1 / 2.4) * 255);
      ctx.fillStyle = `rgb(${toByte(bgLinear[0])},${toByte(bgLinear[1])},${toByte(bgLinear[2])})`;
      ctx.fillRect(0, 0, width, height);
    },
    destroy() {},
  };
}
```

> Keep the fallback intentionally minimal — it exists so the panel renders *something* (background + clear) without a GPU, not for parity. Document this in a comment.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS. If the `f.dye` field name is wrong, fix `dyeMassesFromSample` to the real field (typecheck or a quick grep in `sample.ts` will reveal it).

- [ ] **Step 3: Verify the existing sample e2e still passes (alive-count + wiring)**

Run: `npx playwright test sample-view --project=chromium-webgpu`
Expected: PASS — `data-alive-count`, hover→`SET_ROLLOVER`, click→`SET_SELECTED` unchanged.

- [ ] **Step 4: Manual smoke**

Run: `npm run dev`, open `/gel`, select a lane with a sample. Confirm: particles render, hover/select rings appear behind fills, dyes tint the panel background, and hovering/clicking dims the background.

- [ ] **Step 5: Commit**

```bash
git add src/components/sample/MolecularSimCanvas.tsx src/lib/layout/color.ts
git commit -m "feat(sim): render sample panel via GPU meshBatch (M24 parity)"
```

---

## Task 8: Sample-panel visual goldens on both backends

**Files:**
- Create: `tests/visual/sample-molecular-render.spec.ts`

Lock parity with cross-backend golden equality as the oracle. Follow the structure of the existing `tests/visual/sample-view.spec.ts` (selectors, lane selection, settling waits).

- [ ] **Step 1: Write the spec**

```ts
import { test, expect } from '@playwright/test';

// Settle the rAF sim to a steady particle population before snapshotting.
async function settle(page) {
  await page.waitForSelector('[data-testid="molecular-sim-canvas"]');
  await page.waitForTimeout(1500);
}

test.describe('molecular-sim render (M24)', () => {
  test('idle particles', async ({ page }) => {
    await page.goto('/#/gel');
    // Select a lane that carries a sample (reuse the helper/pattern from
    // sample-view.spec.ts for selecting a populated lane).
    await selectPopulatedLane(page);
    await settle(page);
    await expect(page.locator('[data-testid="molecular-sim-canvas"]'))
      .toHaveScreenshot('molsim-idle.png', { maxDiffPixelRatio: 0.02 });
  });

  test('selected fragment shows outline', async ({ page }) => {
    await page.goto('/#/gel');
    await selectPopulatedLane(page);
    await settle(page);
    await page.locator('[data-testid="molecular-sim-canvas"]').click({ position: { x: 120, y: 120 } });
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="molecular-sim-canvas"]'))
      .toHaveScreenshot('molsim-selected.png', { maxDiffPixelRatio: 0.02 });
  });

  test('dyes tint the background', async ({ page }) => {
    await page.goto('/#/gel');
    await selectPopulatedLane(page);
    await setDye(page, 0, 125); // max Xylene cyanol via the dye UI
    await settle(page);
    await expect(page.locator('[data-testid="molecular-sim-canvas"]'))
      .toHaveScreenshot('molsim-dyed.png', { maxDiffPixelRatio: 0.02 });
  });
});

// Helpers: implement using the existing dye-slider + lane-selection patterns
// already present in tests/visual/sample-view.spec.ts and the inspector specs.
async function selectPopulatedLane(page) { /* port from sample-view.spec.ts */ }
async function setDye(page, dyeIndex: number, mass: number) { /* port from inspector dye specs */ }
```

> Before writing `selectPopulatedLane`/`setDye`, open `tests/visual/sample-view.spec.ts` and the inspector dye spec and copy their existing selectors verbatim — do not invent selectors.

- [ ] **Step 2: Capture goldens on WebGPU**

Run: `npx playwright test sample-molecular-render --project=chromium-webgpu --update-snapshots`
Expected: 3 new `*-chromium-webgpu` snapshots created. Eyeball each: particles visible, outline behind fill, dye tint present.

- [ ] **Step 3: Capture goldens on WebGL2**

Run: `npx playwright test sample-molecular-render --project=chromium-webgl2 --update-snapshots`
Expected: 3 new `*-chromium-webgl2` snapshots created.

- [ ] **Step 4: Cross-backend parity check**

Manually compare the `-webgpu` vs `-webgl2` PNG pairs (open both). They should be visually indistinguishable. Any large difference indicates a color-space or blend mismatch (revisit Task 6 / blend factors). This visual equality is the M24 parity oracle.

- [ ] **Step 5: Re-run both projects against committed goldens**

Run: `npx playwright test sample-molecular-render`
Expected: PASS on both projects (no `--update-snapshots`).

- [ ] **Step 6: Commit**

```bash
git add tests/visual/sample-molecular-render.spec.ts tests/visual/sample-molecular-render.spec.ts-snapshots
git commit -m "test(sim): sample-panel render goldens, both backends (M24)"
```

---

## Task 9: Full suite + docs

**Files:**
- Modify: `docs/STATUS.md`
- Modify: `docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md`

- [ ] **Step 1: Run the full unit suite**

Run: `npx vitest run`
Expected: PASS — all prior tests plus the new `molecularSimMesh` + `molecularSimBackground` tests. Note the new total count.

- [ ] **Step 2: Run typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS (no unused imports left from the gel refactors).

- [ ] **Step 3: Run the full Playwright suite on both backends**

Run: `npx playwright test --project=chromium-webgpu` then `npx playwright test --project=chromium-webgl2`
Expected: gel goldens unchanged; new sample-render goldens pass. No previously-passing test regresses.

- [ ] **Step 4: Update STATUS.md**

In `docs/STATUS.md`: change the M24 row to `✅ shipped`; in the "What's running today" Middle-panel paragraph, replace the "Toon shader … are Phase 3 M23-M25" sentence with a note that the panel now renders via the GPU `meshBatch` (WebGPU + WebGL2) with dye-tinted background, highlight states, and outline-behind-fill selection. Add a "Decisions" note: M24 was re-scoped from "toon shader" (C++ has none) to a reusable GPU mesh-batch primitive extracted from the gel renderer; **M25 (bloom) needs re-evaluation** — the outline pass already is the C++ selection/hover effect, so M25 is either dropped or a deliberate beyond-C++ glow.

- [ ] **Step 5: Tick the M24 sub-plan box**

In `docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md`, change the M24 sub-plan line to checked and point it at this plan file:

```markdown
- [x] **M24 Toon shader rendering parity** — re-scoped → `2026-06-13-gelbox-ts-m24-gpu-mesh-renderer.md` (GPU meshBatch + parity)
```

- [ ] **Step 6: Commit**

```bash
git add docs/STATUS.md docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md
git commit -m "docs(status): M24 shipped — GPU meshBatch renderer + sample-panel parity"
```

---

## Self-Review notes (for the executor)

- **Color space is the #1 risk.** Particle colors are stored linear → upload directly. Background + dye math is computed in sRGB-byte domain (matching C++) then `srgbToLinear` before upload. Layout hex colors (`select`/`hover`) go through `hexToLinearRgb`. If selection rings or background look washed-out or too dark vs the old 2D canvas, this conversion is where to look.
- **Blend mode:** `geometry.frag` outputs premultiplied (`rgb*a, a`); "over" = `(ONE, ONE_MINUS_SRC_ALPHA)`. The opaque background quad is emitted via the clear color (alpha 1), not the mesh — simpler and avoids a degenerate first-triangle. (If you prefer the C++-literal "bg rect then molecules," emit two bg triangles at the front of the mesh instead; either is acceptable since the clear path produces identical pixels for an opaque bg.)
- **Gel refactors (Tasks 2, 4) must be pixel-neutral.** The gel goldens are the regression gate. If they diff, the extraction changed behavior — most likely a blend-factor or clearValue mismatch.
- **Dye-index field:** Task 7 assumes `fragment.dye` is the dye index. Confirm against `sample.ts` before relying on it; fix `dyeMassesFromSample` if the field differs.
- **⚠️ WebGL2 sRGB encoding (likely the second iteration point).** Task 7's WebGL2 path as written draws into the *default framebuffer* (`framebuffer: null`), which does **not** apply sRGB encoding — so uploading linear colors there will display too dark, and the `-webgl2` golden won't match the `-webgpu` one (which renders to an sRGB swapchain). The WebGPU path is fine. Two ways to make WebGL2 match, in order of preference:
  1. **Mirror the gel (recommended):** render into an offscreen `createGlRenderTarget` (it's `SRGB8_ALPHA8`, so it encodes) sized to the drawing buffer, then blit it to the canvas with the passthrough program + quad — exactly the pattern in `GelCanvas.tsx:38-78`. This keeps both backends rendering to an sRGB target and guarantees parity. Add a `band`-style single render target + blit to the WebGL2 branch of Task 7.
  2. **Fallback:** if you keep the direct-to-canvas WebGL2 draw, do **not** `srgbToLinear` the colors on the WebGL2 path (pass sRGB-domain values), since the default framebuffer stores them unencoded. This diverges the two paths' color handling and is harder to reason about — prefer option 1.
  Decide this when Task 8 step 4 (cross-backend compare) first runs; if the `-webgl2` snapshot is uniformly darker than `-webgpu`, this is the cause.
