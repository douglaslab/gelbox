# Gelbox TS — M24 Design: GPU Mesh-Batch Renderer + Sample-Panel Parity

_Design date: 2026-06-13. Phase 3, Milestone M24. Supersedes the "toon shader"
framing in `2026-05-09-gelbox-ts-phase-3-overview.md`._

## Summary

Render the molecular-sim sample panel through the GPU (WebGPU primary, WebGL2
fallback) instead of the current 2D canvas. The deliverable is a **reusable 2D
triangle-mesh batch primitive** (`meshBatch`) — the first general geometry pass
in the repo — with `MolecularSimCanvas` as its first consumer. Closes the two
real parity gaps with C++ `MolecularSim` (dye-tinted background with highlight
states; outline-behind-fill selection effect) along the way.

## Rationale (why GPU, stated honestly)

A finding from reading the C++ reframes this milestone: **`MolecularSim.cpp`
uses no GLSL shader at all.** Particles are drawn with Cinder immediate-mode
`gl::draw` of flat-colored triangle meshes (`appendColors(&color, 1)` —
one flat color per vertex, no gradient/lighting/rim pass). The "toon" look is
pure geometry: per part, draw the mesh inflated by `outlineWidth` in the
select/rollover color *first*, then the flat fill on top (outline-behind-fill).
The background is a solid rect tinted by dyes and dimmed by a 3-state highlight.

Consequences:

- The gel renderer's M4 shader model (`render.ts`/`render-gl.ts` +
  `warp.frag`/blur) **does not extend here** — there is no shader to port.
- The current 2D canvas already reproduces *today's* effects (slice
  degradation via clip+fill, multimers, fades — shipped M21–M23). So the
  justification is **not** "canvas can't do the current effects."

The durable reasons to go GPU anyway:

1. **Reusable capability.** A backend-parity 2D mesh-batch renderer is useful
   far beyond gelbox (vector/mesh/particle/chart rendering). Every existing
   pass in `gel/passes/` is full-screen post-processing; the repo has **no
   general geometry/mesh pass**. Cinder gave the C++ this for free via
   `gl::draw(TriMesh)`; we don't have an equivalent. This builds it.
2. **Headroom.** Effects that *would* fight a 2D canvas — real toon/rim
   shading, bloom (M25), any fragment-shader work — become tractable on the
   GPU substrate.

Visual output this milestone is identical to the current canvas (C++ is
flat-fill). The payoff is the primitive and the headroom, not new pixels.

## Verification approach

Code-derived parity (match the C++ source as written) locked in with our own
Playwright goldens. No C++ build required. Because there is no pre-existing
canvas golden to diff against, the parity oracle is twofold:

- **Cross-backend self-consistency** — WebGPU and WebGL2 goldens must match.
- **Unit tests** — on the pure CPU mesh builder and the background-color
  helper, checked against hand-computed values from the C++ source.

## Architecture

```
MolecularSimCanvas (React)
  ├─ selectBackend()  →  webgpu | webgl2 | none
  ├─ acquires GPU surface (mirrors GelCanvas.tsx mount pattern)
  ├─ rAF loop: engine.tick → buildMoleculesMesh → meshBatch.setMesh → meshBatch.draw
  ├─ pointer events → engine.pickFragment (CPU, unchanged) → dispatch SET_ROLLOVER/SET_SELECTED
  └─ none backend → minimal 2D-canvas fallback (CI / no-GPU safety)

lib/gpu/meshBatch.ts        (WebGPU)   ─┐ identical interface,
lib/gpu/gl/meshBatch.ts     (WebGL2)   ─┘ backend-parity (M4 model)

lib/sim/molecularSimMesh.ts            pure: parts → { vertices, indices }
lib/sim/molecularSimBackground.ts      pure: (dyeMasses, highlight) → rgba
```

### Component 1 — `meshBatch` (reusable primitive)

`lib/gpu/meshBatch.ts` (WebGPU) + `lib/gpu/gl/meshBatch.ts` (WebGL2).

- **Vertex format:** interleaved `f32 [x, y, r, g, b, a]`, indexed triangle
  list (`Uint32Array`).
- **Interface (identical across both backends):**
  ```ts
  createMeshBatch(target, opts: { viewport: { w: number; h: number } }) => {
    setMesh(vertices: Float32Array, indices: Uint32Array): void;
    setBackground(rgba: [number, number, number, number]): void;
    draw(): void;        // clear to background, then draw the batch
    resize(w: number, h: number): void;
    destroy(): void;
  }
  ```
- **Blending:** straight alpha (`src_alpha`, `one_minus_src_alpha`) — matches
  C++ `ColorA` over the background fill.
- **Projection:** orthographic; sim-bounds → clip space via a small uniform
  (offset + scale), mirroring the gel blit's uniform layout in `GelCanvas.tsx`.
- **Shaders:** `meshbatch.vert.{wgsl,glsl}` (apply ortho transform, pass
  position) + `meshbatch.frag.{wgsl,glsl}` (output interpolated vertex color).
  The `rgba8unorm-srgb` target performs sRGB encoding.
- **Streaming:** the vertex/index buffers are rewritten each frame; allocate a
  dynamic buffer and grow (double) when a frame's mesh exceeds capacity.

### Component 2 — CPU mesh builder

`lib/sim/molecularSimMesh.ts` — pure function:

```ts
buildMoleculesMesh(
  parts: Part[],
  selectedFragment: number | null,
  rolloverFragment: number | null,
  tuning,
) => { vertices: Float32Array; indices: Uint32Array }
```

Port of C++ `makeMoleculesMesh` + `makeMesh`/`makeMesh_slice`:

- Per part, two sub-passes accumulated into the shared arrays, in C++ order:
  1. **Outline pass** — emitted only if the part's fragment is selected or
     rollover. The part's slice-degraded ellipse, triangulated, inflated by
     `outlineWidth`, in the outline color.
  2. **Fill pass** — the same geometry at base radius in the part's flat color
     at `fade` alpha.
  Outline first so the fill sits on top → ring effect.
- **Slice degradation as geometry.** Today's canvas clips the unit ellipse to a
  left-anchored rect of width `2·max(0.05, wholeness²)`. Here that becomes a
  triangulated polygon (the clipped ellipse), built as a triangle fan, because
  a shader pipeline cannot carry a 2D-canvas clip. Vertex count per ellipse
  follows the existing circle-tessellation count.
- **Multimers.** Each `Part.multi` slot offset by
  `m.loc · min(radius) · MULTIMER_LOC_SCALE`, rotated by `p.angle + m.angle`
  (same math as the current canvas).
- **Outline color.** `selected → selectColor`, `rollover → hoverColor`,
  `both → lerp(select, hover, 0.5)` (C++ `MolecularSim.cpp:600-601`).
- Deterministic and rendering-free → unit-testable on vertex/index output.

### Component 3 — Background

`lib/sim/molecularSimBackground.ts` — pure function, port of
`MolecularSim::drawBackground`:

```ts
computeBackgroundColor(
  dyeMasses: number[],     // 4 dye masses from the sample
  highlight: 0 | 1 | 2,    // idle | hover | mouse-down
) => [number, number, number, number]
```

- Base = `molecularSimBkgndColor` (`#F1F1F2`) × `[1.0, 0.97, 0.9][highlight]`.
- For each of 4 dyes: `norm = mass / sliderDyeMassMax`; `c += dyeColor·norm`;
  `w += norm`; finally `c /= w`.
- Dye colors (`Dye.h`): `0x00AFE2, 0x985D93, 0xB3A7D3, 0xFACB01`.
- `highlight` derives from panel pointer state (down > hover > idle), tracked in
  `MolecularSimCanvas` from the existing pointer handlers.
- Result passed to `meshBatch.setBackground` (the clear color) — no separate
  pass.

### Component 4 — `MolecularSimCanvas` rework

Move from `getContext('2d')` to a GPU surface, mirroring `GelCanvas.tsx`:

- Mount-once effect: `selectBackend()` → async-import the WebGPU or WebGL2 path,
  acquire context, create `meshBatch`. Reuse the `cancelled`-guard +
  teardown-on-unmount structure.
- rAF tick loop: `engine.tick(1)` → `buildMoleculesMesh(...)` →
  `meshBatch.setBackground(computeBackgroundColor(...))` → `meshBatch.setMesh` →
  `meshBatch.draw()`. The engine stays in a ref; React state is untouched
  per-frame (unchanged from M21).
- **Picking unchanged** — `engine.pickFragment` (CPU geometry) and the existing
  `SET_ROLLOVER` / `SET_SELECTED` dispatch wiring carry over verbatim.
- `data-testid="molecular-sim-canvas"` and `data-alive-count` preserved for e2e.
- **`none` backend** — retain a minimal 2D-canvas fallback (a trimmed version of
  today's draw path) so the panel still renders particles where no GPU is
  available (CI safety). Kept deliberately small.

### Color space

Particle colors are stored **linear** in the engine. Upload linear vertex
colors to an `rgba8unorm-srgb` target and let the target encode — dropping the
`linearRgbToSrgbHex` canvas workaround. The background-tint arithmetic must
replicate the C++ byte/sRGB-domain math (Cinder `Color::hex` loads raw bytes,
no gamma), then convert the result to linear before upload. This is the one
fiddly correctness spot and the most likely source of cross-backend drift; the
plan calls it out as its own verification step.

## Testing

- **Unit** (`vitest`):
  - `buildMoleculesMesh` — vertex/index counts and positions for: monomer,
    multimer cluster, fully-sliced particle, selected (outline emitted),
    rollover, selected+rollover (lerp color).
  - `computeBackgroundColor` — idle/hover/down with zero dyes; mixed dyes
    against hand-computed C++ values.
- **Visual** (`playwright`): sample-panel goldens on **both**
  chromium-webgpu and chromium-webgl2 — idle / hover / selected / with-dyes.
  Cross-backend equality is the parity oracle.

## Scope boundaries

In scope: `meshBatch` (both backends), CPU mesh builder, background helper,
`MolecularSimCanvas` GPU rework, the two parity behaviors, unit + visual tests.

Out of scope:

- **M25 (bloom) is re-evaluated, not implemented here.** The outline pass *is*
  the C++ selection/hover effect; C++ has no separate bloom shader. After M24,
  M25 becomes either a no-op or a deliberate beyond-C++ glow (cheap on the new
  GPU substrate). Decision deferred to when M25 starts.
- `drawRepresentativeOfFrag` (single-fragment glyph) — not used by the panel
  render path.
- Loupe parity (M26), image-as-sample (M27).
- No engine/sim-logic changes; this is purely the render path.

## Risks

| # | Risk | Mitigation |
|---|------|-----------|
| 1 | Cross-backend color drift (sRGB encode + bg byte-domain math) | Dedicated verification step; cross-backend golden equality catches it |
| 2 | Surface rework (context loss, resize, DPR) adds latency | Copy the proven `GelCanvas.tsx` mount/teardown pattern; keep `none` fallback |
| 3 | Slice-as-geometry triangulation differs subtly from canvas clip | Unit-test vertex output; eyeball degraded particles in `/gel` |
| 4 | Milestone larger than original stub (new primitive + 2-backend surface) | ~1.5–2.5 weeks; primitive is the bulk and is reusable, so the cost amortizes |

## References

- C++ render path: `~/code/gelbox/src/MolecularSim.cpp`
  (`drawBackground` L510, `makeMoleculesMesh` L579, `makeMesh*` L770-902)
- C++ highlight state: `~/code/gelbox/src/SampleView.cpp:123-129`
- Dye colors: `~/code/gelbox/include/Dye.h:58-63`
- Existing GPU infra: `ts/src/lib/gpu/` and `ts/src/lib/gpu/gl/`
- Backend selection + surface mount pattern: `ts/src/components/gel/GelCanvas.tsx`,
  `ts/src/lib/gel/backend.ts`
- Current canvas (to be reworked): `ts/src/components/sample/MolecularSimCanvas.tsx`
- Phase 3 overview: `docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md`
