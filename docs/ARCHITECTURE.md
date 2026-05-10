# Gelbox TS — Architecture

This document describes the runtime architecture of the Gelbox web port as of M18 (2026-05-09). For the milestone-by-milestone implementation history, see [`superpowers/plans/`](superpowers/plans/).

Phase 1 (M1–M9, the renderer + sim + interaction core) was followed by Phase 2 (M10–M18, the UI parity rebuild — three-panel stage, custom slider primitives, three context-swapped inspector panels). Phase 3 (molecular-sim visual parity) is deferred.

## Routes

| Route | Component | Purpose |
|---|---|---|
| `/#/`                | `HomePage`      | Landing page; links to other routes |
| `/#/gel`             | `GelPage`       | The user-facing interactive gel app |
| `/#/dev`             | `DevPage`       | Single-band fixture rendered via the renderer; capability probe display |
| `/#/dev/multi`       | `DevMultiPage`  | 50-band fixture (renderer-isolated golden) |
| `/#/dev/perf`        | `DevPerfPage`   | rAF-loop perf gate (50 bands) |
| `/#/dev/sim`         | `DevSimPage`    | Sample-driven scene (1kb ladder via `fragToBands`) |

`/#/gel` is the user app; the dev routes exist for renderer/sim isolation testing and Playwright goldens.

## Rendering pipeline

```
Sample → fragToBands → Band[] → setBands(bands) → renderer.render() → blit-to-canvas
                ▲                       │
                │                       │
         (per-fragment dispatch)        ▼
                                  WebGPU OR WebGL2
                                  per selectBackend()
```

Per band, the renderer runs five passes in sequence into a per-band ping-pong:

1. **Geometry** — primitives mesh (smear + body + flames) drawn into `band.current` with `loadOp: clear`.
2. **Smile warp** — sample → control texture → write deflected band → swap.
3. **Welldamage warp** — same shape; only runs if `wellDamage > 0`.
4. **Blur** — separable Gaussian (5/9/13-tap kernels), 1/2/3-pixel steps, two directions.
5. **Composite** — band.current → composite.current with premultiplied additive blend (`ONE, ONE`); first band of frame clears, rest accumulate.

After the band loop:

6. **Overcook** — global 2D warp on the composite ping-pong (only if `globalWarp.h2oDistort` is on).

The composite ping-pong's `current` slot is what the canvas blit samples.

### Backends

`lib/gel/render.ts` — WebGPU GelRenderer.
`lib/gel/render-gl.ts` — WebGL2 GelRenderer (parallel implementation; same `GelRenderer` interface).

The WebGL2 path uses hand-ported GLSL ES 3.00 mirrors of the WGSL shaders. The two stay in lock-step: editing a `.wgsl` file requires editing the matching `.glsl`. Translation rules are documented in M4's plan (`2026-04-28-gelbox-ts-m4-webgl2-fallback.md` § "WGSL → GLSL ES 3.00 translation rules").

The WebGPU passes (`lib/gel/passes/*.ts`) use per-call resource pools to avoid the WebGPU async-write bug detailed in `feedback_webgpu_queue_ordering.md` — `device.queue.writeBuffer/writeTexture` is queued globally and does NOT serialize with command-buffer recording, so multi-call patterns over a shared resource silently produce wrong output. Each pass module owns a per-call pool indexed by the band's frame-position; `render.ts` threads the index.

The WebGL2 path doesn't share that pitfall (synchronous), but it had a different latent bug (M4-era warp pass sampled at unflipped texCoord while writing at Y-flipped clipY → vertical-flip output). Fixed by setting `uTexCoordScale=(1,-1)` + `uTexCoordOffset=(0,1)` in `runWarp` (commit `e141765`).

### Per-backend goldens

Both backends produce visually-equivalent output for identical Band[] inputs, but pixel-level output differs (sampling/precision). Playwright snapshot template `{testFilePath}-snapshots/{arg}-{projectName}{ext}` auto-suffixes baselines per project (`chromium-webgpu`, `chromium-webgl2`).

## Simulation

`lib/sim/gelSim.ts` is the entry point: `fragToBands(sample, fragi, wellRect, lane, ctx) → Band[]`.

The dispatcher splits by fragment type:
- **Dye** (`frag.dye >= 0` && `mass > 0`) → single dye band via `dyeToBand`.
- **Empty/zero aggregate** → single monomer band via `fragAggregateToBand(... , 1, 1, ...)`.
- **Aggregate with weights** → one band per non-zero entry; mass scaled by `weight / sum`.

Each `fragAggregateToBand` runs a five-phase pipeline:

1. `calcDegradeAsBP` — degradation 0–2 → bp shifts.
2. `calcDeltaY` — five-step mobility curve (size, aspect ratio, curve, voltage, time).
3. `calcBandAlpha` + brightness assembly.
4. `calcBandDiffusion` — two-piece blur curve.
5. `calcBandGeometry` — rect + smearAbove (H2O bump) + smearBelow + flame height + smile + seeds.

Tuning constants are in `data/tuning.ts` — `GEL_RENDER_TUNING` (M3-era, sourced from `gel-render.json`) and `GEL_SIM_TUNING` (M5-era, sourced from `gel-sim.json` — note that JSON values diverge from C++ header defaults in 4 places; **use JSON**).

The sim is fully deterministic (mulberry32 RNG seeded from `lane`/`mass`/`voltage`/etc.) — running it twice on the same inputs produces byte-equal Band[].

### Reverse solver

`lib/sim/solver.ts:solveBasesForY` runs a binary search over bp inverting the mobility curve when the user drags a band. Up to 30 iterations; sub-millisecond. Used by `GelOverlay`'s drag handler.

## State

`lib/gel/gelState.ts` defines the gel-page state shape and reducer. State lives in `GelContext` (`components/gel/GelContext.tsx`) — a React Context wrapping `useReducer(gelReducer, initialGelState)`. Two hooks: `useGelState()` and `useGelDispatch()`.

Top-level shape:

```ts
interface GelState {
  samples:               (Sample | null)[];   // length = numLanes (default 7)
  numLanes:              number;
  ctx:                   SimContext;
  selectedLane:          number;
  selectedFragmentIndex: number | null;
  lastSampleLane:        number | null;       // sticky pointer for the Sample slot
  fixtureKey:            string;
  modifiers:             { shift: boolean; alt: boolean; meta: boolean };
  drag:                  DragState | null;    // 'band' or 'sample' discriminated union
  gelSize:               { width: number; height: number };
  pixelsPerUnit:         number;
  wellRects:             Rect[];              // computed from numLanes + gelSize
  loupes:                LoupeRef[];
  loupeNextId:           number;
  selection:             SampleFragRef | null; // C++ SampleFragRefRef mirror — currently complementary to selectedFragmentIndex
  rollover:              SampleFragRef | null; // hover state — feeds GelOverlay band stroke + SampleView dot rings
  inspectorMode:         'default' | 'gel-settings' | 'sample-settings' | 'fragment';
  gelRotate:             number;              // cosmetic, degrees
}
```

The cross-panel hover/select channel uses `selection` and `rollover`; `selectInspectorView(state)` (in `gelState.ts`) collapses the (inspectorMode, selectedFragmentIndex, samples[selectedLane]) triple into the four-valued render decision used by `<InspectorPanel>`.

The reducer is exhaustively switch-checked (`default` branch asserts `never`). All actions are pure data updates; there's no async, no observer pattern, no side effects in the reducer itself.

State mutations propagate synchronously: action dispatch → React re-render → `GelInner` re-runs `fragToBands` for every fragment in every non-null sample → `GelCanvas` setBands + render. The sim is fast enough (<1ms for ~50 bands) that re-rendering on every drag-move pointer event is fine.

## Components (`/#/gel`)

The `/gel` route is composed as a fixed-size three-panel stage (`<Stage>`)
with the gel on the left, the molecular-sim canvas in the middle, and a
context-swapped inspector on the right. Layout positions come from
`lib/layout/layout.ts` (port of `Layout.h`).

| Component | Path | Role |
|---|---|---|
| `GelPage`              | `routes/GelPage.tsx`                       | Top-level route; provider + Stage composition + drop-zone |
| `Stage`                | `components/stage/Stage.tsx`               | 1365×768 fixed frame, scale-to-fit on narrow viewports |
| `Brace`                | `components/stage/Brace.tsx`               | Decorative brace between Sample and Inspector |
| `GelCanvas`            | `components/gel/GelCanvas.tsx`             | Backend-dispatching canvas wrapper |
| `GelOverlay`           | `components/gel/GelOverlay.tsx`            | SVG hit-test layer + band drag + tab nav |
| `MicrotubeRow`         | `components/gel/MicrotubeRow.tsx`          | Microtube icons above the canvas; sample drag-between-lanes |
| `SettingsButton`       | `components/gel/SettingsButton.tsx`        | Gear button, toggles `inspectorMode` between `gel-settings` and previous |
| `TimelineSlider`       | `components/gel/TimelineSlider.tsx`        | Time slider below the gel |
| `LoupePortalLayer`     | `components/gel/LoupePortalLayer.tsx`      | Renders all open loupes |
| `Loupe`                | `components/gel/Loupe.tsx`                 | Single loupe popover |
| `SampleView`           | `components/sample/SampleView.tsx`         | Middle panel: heading + microtube glyph + MolecularSimCanvas |
| `MolecularSimCanvas`   | `components/sample/MolecularSimCanvas.tsx` | Phase-2 placeholder dot scatter; hover/click round-trips through `selection`/`rollover` |
| `InspectorPanel`       | `components/inspector/InspectorPanel.tsx`  | Routes by `selectInspectorView(state)` to one of the three views below |
| `FragmentView`         | `components/inspector/FragmentView.tsx`    | "Species" — fragment editor (5 sliders + palette + well preview) |
| `SampleSettingsView`   | `components/inspector/SampleSettingsView.tsx` | "Buffer + Dyes" — sample buffer + 4 dye sliders |
| `GelSettingsView`      | `components/inspector/GelSettingsView.tsx` | "Gel" — voltage/time/lanes/rotate/well-damage + gel buffer |
| `BufferView`           | `components/inspector/BufferView.tsx`      | 4 ion sliders + 3-button preset selector (re-used by both settings panels) |
| `DyeRow`               | `components/inspector/DyeRow.tsx`          | Single dye Style::Bar slider with dye-color fill |
| `ColorPaletteView`     | `components/inspector/ColorPaletteView.tsx`| 12-color swatch grid for FragmentView |
| `FragmentWell`         | `components/inspector/FragmentWell.tsx`    | 80×80 fragment preview tile |
| `SliderView`           | `components/primitives/SliderView.tsx`     | Custom slider widget (Style::Slider, ::Bar, ::Graph) |

The dev pages (`DevPage`, `DevMultiPage`, `DevPerfPage`, `DevSimPage`) are renderer-isolated harnesses; they each manually mount/unmount via the `selectBackend()` dispatch (predates the M6-era `<GelCanvas />`).

## File map (`ts/src/`)

```
data/
  tuning.ts                # GEL_RENDER_TUNING + GEL_SIM_TUNING
lib/
  gel/
    backend.ts             # selectBackend()
    band.ts                # legacy Band shape (re-exported from sim/band)
    body.ts, smear.ts, flames.ts  # per-pass mesh builders
    gelState.ts            # state + reducer + selectInspectorView selector
    sampleFragRef.ts       # SampleFragRef type — cross-panel ref alias
    mesh.ts                # Mesh type + VERTEX_STRIDE
    overcook.ts            # 2D global warp generator
    render.ts              # WebGPU GelRenderer
    render-gl.ts           # WebGL2 GelRenderer (parallel)
    serialize.ts           # save/load JSON
    smile.ts               # 1×N smile warp generator
    warpTexture.ts         # WarpTextureCpu type
    welldamage.ts          # 1×N welldamage warp generator
    passes/                # WebGPU pass modules (per-call pools)
      blur.ts, composite.ts, primitives.ts, warp.ts
  gpu/
    adapter.ts, context.ts, device.ts, quad.ts, shader.ts, surface.ts, target.ts, uniforms.ts
    gl/                    # WebGL2 wrappers (parallel layout)
      context.ts, device.ts, program.ts, quad.ts, target.ts
  layout/
    assets.ts              # DPR-aware asset URL resolution
    layout.ts              # field-by-field port of C++ Layout.h
  sim/
    aggregate.ts, band.ts, brightness.ts, buffer.ts, diffusion.ts, dye.ts,
    gelSim.ts, geometry.ts, globalWarp.ts, mobility.ts, molecularSim.ts (Phase 2 placeholder),
    rng.ts, sample.ts, solver.ts
  slider/
    slider.ts              # data model: SliderConfig + helpers (calcNormalizedValue, applyNotchSnap, …)
shaders/
  *.wgsl                   # WebGPU sources (8 files)
  *.glsl                   # WebGL2 mirrors (8 files)
components/
  AppLayout.tsx, TabNav.tsx, ThemeToggle.tsx
  stage/    Stage.tsx, Brace.tsx
  gel/      GelCanvas.tsx, GelOverlay.tsx, GelContext.tsx, MicrotubeRow.tsx,
            SettingsButton.tsx, TimelineSlider.tsx, Loupe.tsx, LoupePortalLayer.tsx
  sample/   SampleView.tsx, MolecularSimCanvas.tsx
  inspector/ InspectorPanel.tsx, FragmentView.tsx, SampleSettingsView.tsx,
             GelSettingsView.tsx, BufferView.tsx, DyeRow.tsx, ColorPaletteView.tsx,
             FragmentWell.tsx
  primitives/ SliderView.tsx, Slider.tsx (legacy)
routes/
  HomePage.tsx, GelPage.tsx, DevPage.tsx, DevMultiPage.tsx, DevPerfPage.tsx, DevSimPage.tsx
fixtures/states/
  single-band.json, 50-band.json, ladder-1kb.json
```

## Testing

- **Unit (Vitest):** 234+ tests covering sim algorithms, state reducer (incl. M16 `SET_SAMPLE_BUFFER`/`SET_DYE_MASS`, M17 `SET_NUM_LANES`/`SET_GEL_ROTATE`), solver, slider primitive, RNG, dye constants, layout port, the M15 `calcTargetPop`/`layoutDots`/`pickDot` placeholder helpers, and the M18 `selectInspectorView` decision matrix.
- **Visual (Playwright):** Two backend projects (`chromium-webgpu`, `chromium-webgl2`); each runs the same tests with per-project goldens. The Phase 2 specs (`stage`, `slider`, `gelview`, `fragment-view`, `sample-view`, `sample-settings`, `gel-settings`, `inspector-wiring`) cover the new chrome and panels. Linux skips WebGPU project's visual tests.

CI runs typecheck + unit + build + Playwright on Ubuntu (`ts/.github/workflows/ci.yml`). Linux's chromium-webgl2 project IS the visual gate; chromium-webgpu visual tests skip on Linux.

## Deferred / known issues

- **Phase 3 — Molecular simulation parity.** The middle-panel
  `MolecularSimCanvas` (M15) is a placeholder dot scatter wired up for
  hover/select; faithful particle physics, toon shading, aggregate
  clustering, and the loupe-scene parity (M7b) all roll into Phase 3.
- **Off-preset gel buffer editing.** M17 ships the gel `BufferView`
  with preset buttons only; the per-ion sliders inside it dispatch to
  `SET_GEL_BUFFER` which currently only accepts preset tags. A
  `SET_GEL_BUFFER_DIRECT` action is the obvious extension when needed.
- **SampleSettingsView visual polish.** Wiring is correct but the dye/
  buffer slider gutters are tight, preset-matched notches inside the
  buffer sliders aren't rendered, and the rule above the "Dyes"
  subhead is omitted. Tracked in STATUS.md.
- **WebGPU perf in CI** — flakes under parallel-project load. The
  per-project run is the meaningful gate.
- **Linux WebGPU** — `chromium-headless` can't acquire a Vulkan adapter
  reliably even with `mesa-vulkan-drivers + SwiftShader ICD` env.
  Visual coverage on Linux uses WebGL2 only.
- **M9b** — theme propagation to canvas content (CSS chrome themes;
  canvas does not).
