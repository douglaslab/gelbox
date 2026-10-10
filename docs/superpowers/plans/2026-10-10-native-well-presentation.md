# Native Well Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Execute inline under the existing authorization; no new delegation or approval is needed.

**Goal:** Replace SVG well strokes with the independently verified native line raster on both renderers, preserving all existing gel behavior.

**Architecture:** Draw the gel image and wells into a four-sample physical-resolution presentation target owned by the existing gel canvas renderer. Resolve that target into the canvas using the verified orientation and rounding; retain SVG geometry for DOM observability/picking with no visible well stroke. Effects simulation textures remain at their current native resolution. Direct-band mode renders its base image to an intermediate texture and uses the same presentation path.

**Tech Stack:** TypeScript, React, WebGL2, WebGPU, Playwright.

**Spec:** `docs/ROADMAP.md` and `reference/native/modern/well-scenes/README.md`.

## Global Constraints

- Strict native behavior and visual parity first; improvements afterward.
- Web application first; no new engine, package dependency, or auxiliary graphics context.
- Pinned native source `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`.
- Preserve both WebGPU and WebGL2 and both effects/direct rendering modes.
- No weakened pixel assertions or replacement of native fixtures with web goldens.
- This increment does not close the full native visual/release gates.

## Review Focus

- Bands crossing wells: wells must blend over the gel itself, including bright/color bands (Task 1/2).
- Live DPR/resize: one physical-pixel lines, unchanged logical geometry/picking (Task 2).
- Direct-render toggle: identical well raster in either mode (Task 2).
- Async failures/context loss: no orphan targets or blank unrecoverable canvas (Task 3).
- Route unmount/repeated setup: dispose renderbuffers as well as existing tracked resource types (Task 3).

### Task 1: Native presentation modules

**Files:** Create `ts/src/lib/gel/present.ts`, `present-gl.ts`, `presentationTypes.ts`; create `ts/tests/visual/native-well-presentation.spec.ts`.

**Interfaces:** `PresentationSize = {width:number;height:number}` uses physical integer pixels; `WellRect = {x1:number;y1:number;x2:number;y2:number}` uses gel units. `createGelPresentation(device:GPUDevice,format:GPUTextureFormat,size:PresentationSize)` returns `{draw(encoder:GPUCommandEncoder,base:GPUTextureView,target:GPUTextureView,wells:readonly WellRect[],scale:number):void;destroy():void}`. GL counterpart `createGlGelPresentation(gl:WebGL2RenderingContext,size:PresentationSize)` returns `{draw(base:WebGLTexture,wells:readonly WellRect[],scale:number):void;destroy():void}` and presents to the default framebuffer. `scale` is physical pixels per gel unit, including app scale and DPR. New instances own size-dependent targets; no allocation per normal draw.

- [x] Add 16-case-per-backend independent native RGB comparisons using these modules (black base texture), and verify they fail before implementation.
- [x] Implement native `.8,.8,.8,.8` one-physical-pixel line loops (closed five-vertex line strips for GPU). Derive vertices from passed geometry. Use the retained prototypes' orientation and four-sample RGBA8 targets. GPU resolve sums normalized samples in float32 in sample-index order (the colored corpus supersedes the initial integer ties-to-even inference); GL uses multisample framebuffer resolve then the necessary display flip.
- [x] Include the base image before lines in the same multisample target. Preserve linear enlargement of native gel textures. Never overlay a transparent raster of wells over separately browser-composited bands: rounding/blending would differ.
- [x] Extend native helper with a nonblack base and a band crossing a well, capture and retain independent references, and test source-over color output on both modules.
- [x] Run `npm --prefix ts run test:visual -- native-well-presentation.spec.ts`; require exact matches in all cases. Commit modules and their references/tests.

### Task 2: Integrate both gel canvas modes

**Files:** Modify `ts/src/components/gel/GelCanvas.tsx`, `DirectBandCanvas.tsx`, `GelOverlay.tsx`, `ts/src/routes/GelPage.tsx`; extend `ts/tests/visual/native-well-stroke.spec.ts`, `native-gel-texture.spec.ts` and `molecular-dpr.spec.ts` or a dedicated gel-DPR test.

**Interfaces:** Both canvas components accept `wells:readonly WellRect[]`; GelPage passes `state.wellRects.slice(0,state.numLanes)`. GelCanvas's existing scientific output texture stays unchanged. Canvas physical backing size is `round(logicalSize*pixelsPerUnit*dpr)`; presentation handles enlargement. DirectBandCanvas renders its current mesh into an intermediate physical-resolution texture, then calls Task 1's presentation method.

- [x] Add failing complete-seven-well startup comparison against the user/native reference on both backends. Assert no SVG visible stroke remains once native presentation is integrated.
- [x] Use Task 1 modules in place of canvas final blits; pass latest wells to async setup and redraw when they change. Use existing resolution-media-query pattern for live DPR updates. Resize presentation resources without changing document state.
- [x] Preserve `gel-well-N` rectangle attributes/test IDs as nonvisible DOM geometry. Remove only their visible stroke; keep band-focus rendering independent (native uses a different overload).
- [x] Verify full startup displayed-band crop remains exact: moving enlargement from browser to GPU must not silently change filtering. Verify scientific offscreen texture tests still use the same native-sized output.
- [x] Test native lane-count changes, effects/direct toggle, and DPR1→2→1 with identical logical picking and document JSON. Require exact well references in both render modes.
- [x] Run affected presentation, native-well-stroke, native-gel-texture, direct-render and DPR cases; inspect any existing golden differences before updating only proven well-edge changes. Commit.

### Task 3: Lifecycle and release regression

**Files:** Extend `ts/tests/visual/renderer-lifecycle.spec.ts` and relevant renderer recovery tests; modify presentation/component cleanup only as failures demonstrate necessary.

- [ ] Track GL `createRenderbuffer/deleteRenderbuffer` alongside current resource types; assert exact baseline return and zero objects on route unmount with the new presentation targets.
- [ ] Add failure injection for multisample allocation and late setup after unmount; use existing bounded recovery/fallback behavior. Direct-mode failure handling must also recover rather than log and remain blank.
- [ ] Verify repeated mode toggles and physical-size changes do not accumulate buffers, textures, framebuffers or renderbuffers.
- [ ] Run `npm --prefix ts run test:unit`, `npm --prefix ts run test:visual`, and `npm --prefix ts run test:production`; require clean results and inspect changed raster artifacts.
- [ ] Record exact scope and limits in STATUS. Commit locally; do not push or mark the full goal complete.
