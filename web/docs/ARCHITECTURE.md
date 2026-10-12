# Gelbox web port — implemented architecture

_Updated 2026-10-09 after native file and shell increments. This describes implemented code._

The target architecture and parity strategy are in [ROADMAP.md](ROADMAP.md). Current gaps are in [PORT-AUDIT.md](PORT-AUDIT.md). The earlier M18 architecture narrative is retained in [archive/ARCHITECTURE-pre-2026-10-09.md](archive/ARCHITECTURE-pre-2026-10-09.md).

## Runtime and routes

The application is a static Vite build with React 18 and TypeScript. HashRouter opens the gel directly at `/#/` and `/#/gel`. Developer routes under `/#/dev` (`multi`, `perf`, `sim`, `slider`) retain the engineering AppLayout header/tabs/theme/footer. The parity workspace has a fixed light palette and uses system Avenir on macOS.

`GelProvider` owns a React reducer from `lib/gel/gelState.ts`. `GelPage` composes a Stage, computes bands, handles native JSON/XML drops, and renders the loupe layer. Stage uses native fixed panel geometry and window-resize offsets. Narrow browser viewports scroll to expose populated panels instead of hiding or scaling them. This browser adaptation remains recorded for parity acceptance.

## Simulation and data

`lib/sim/sample.ts` defines plain samples/fragments, including buffer, bases, mass, degrade, dye, aggregate weights, aspect ratio, and color. Optional native sample metadata is preserved for file interchange; derived-fragment ancestry remains unimplemented.

`fragToBands(sample, fragmentIndex, wellRect, lane, ctx)` dispatches dyes or aggregate tiers. Mobility, degradation, brightness, diffusion, geometry, and seeds live in separate pure modules. `data/tuning.ts` contains ported constants. `solver.ts` inverts band position to bases; its current selection of the first produced band needs native aggregate-aware review.

`GelPage` memoizes the bands and a parallel lane/fragment mapping. It supplies one shared simulation context to every lane. State also stores derived geometry and a selected-sample buffer in that context. The proposed roadmap derives per-sample context and geometry from document data; that separation is not implemented yet.

## Gel rendering

`lib/gel/render.ts` and `render-gl.ts` implement WebGPU and WebGL2 versions of the same renderer contract: `setBands`, `setGlobalWarp`, `render`, output texture, and `destroy`.

Each band passes through geometry (body/smears/flames), smile warp, well-damage warp, separable blur, and additive composition. Global H₂O distortion/faintness is available through `setGlobalWarp`. **The main `GelCanvas` currently calls only `setBands`; global effects are not connected to its running-buffer state.** Dev-scene coverage does not establish real-app integration.

WGSL and GLSL shader pairs implement the two backends. Shared mesh/CPU helpers reduce some duplication; renderer orchestration and backend resource management remain separate. `lib/gpu/meshBatch.ts` and `lib/gpu/gl/meshBatch.ts` are used by gel geometry and molecular rendering.

`GelCanvas` acquires/configures a backend asynchronously and re-renders when bands change. Backend selection honors hash/localStorage overrides, then checks WebGPU API presence before WebGL2. Main-canvas setup failures are logged; automatic recovery/fallback is not a complete application contract. WebGPU device acquisition is cached across surfaces and invalidated after device loss, but existing surfaces are not thereby automatically reconstructed.

## Molecular simulation and loupes

`lib/sim/molecularSimEngine.ts` owns mutable particle state and lifecycle outside React. `molecularSimMesh.ts` builds slice-degraded ellipses, multimer geometry, and outline/fill passes. `molecularSimBackground.ts` computes dye-tinted backgrounds.

`components/sample/SampleSimCanvas.tsx` hosts the reusable particle engine/render surface with WebGPU, WebGL2, and 2D fallback paths. `MolecularSimCanvas.tsx` adapts it to a selected lane and dispatches selection/hover. It is no longer the Phase-2 placeholder scatter.

`sampleFromGel.ts` picks bands and derives a synthetic sample and degradation filter from a gel position. `LoupePortalLayer` memoizes that extraction for open loupes. `Loupe` embeds SampleSimCanvas in a fixed 171×171 popup. Loupes have gel-space anchors and viewport popup positions; dragging, callout chrome, hover preview, and source-species interaction are incomplete. Wholeness/filter calculations contain a documented approximation relative to C++.

## State and interactions

`GelState` combines document data, simulation context/geometry, `selectedLane`/`selectedFragmentIndex`, a separate `selection`, rollover, sticky `lastSampleLane`, inspector mode, modifiers, drag state, rotation, and loupes. Selection is not yet a single authoritative reference.

`GelOverlay` uses SVG band hit rectangles, pointer handlers, a reverse solver, and Tab navigation. `MicrotubeRow` handles sample movement/cloning. Mutation rules are divided between these handlers and reducer actions. Stable source identity, complete native editing/deletion, gesture cancellation, overlap picking, and coordinate handling require the roadmap's interaction work.

`InspectorPanel` chooses species/sample/gel settings. Native control mapping is only partial: rotation is enabled in the web app despite being disabled in native; off-preset gel-buffer edits are ignored while sliders appear editable.

## Files and persistence

`lib/gel/serialize.ts` reads native Gelbox JSON and legacy web formats; exports native JSON. `nativeFile.ts` maps metadata, defaults, scientific fields and lanes, validating native nested types and integer fields. Legacy web nested validation still needs strengthening. `nativeXml.ts` uses browser DOMParser for native palette Sample XML. Unsafe native multimer indices are rejected rather than reproducing memory corruption.

`FileControls.tsx` mounts a bottom-left Open/Save popup. Sample Open uses the first empty lane; drop prefers a targeted empty lane then falls back. Occupied lanes are preserved. Native → web codec → native ladder interchange was verified through the native GUI. Reference-image views, broader interchange cases and complete native settings remain open.

## Tests and delivery

Vitest covers pure modules and reducer behavior. Playwright runs Chromium WebGPU and WebGL2 projects with backend-specific TS golden images; animated particle tests use a freeze hook. Tests under `tests/visual` include functional interaction checks as well as screenshot comparisons.

The workflow is at repository-root `.github/workflows/ci.yml`. Linux skips WebGPU visual coverage and real-GPU performance checks. Local macOS validation of both backends is recorded in STATUS. Exploratory native captures, provenance and exported documents are under `reference/native`; independent numerical certification and a complete scenario corpus remain open.

`npm run build` produces `ts/dist`. Vite's base is relative, but many assets are referenced with absolute `/assets/` paths. Production hosting at a subpath needs explicit verification and asset-path reconciliation. The current renderer and browser matrices should not be treated as a completed cross-browser/native-parity release gate.
