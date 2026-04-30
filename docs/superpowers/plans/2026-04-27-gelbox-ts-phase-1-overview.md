# Gelbox TS Web Port — Phase 1 Overview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a TypeScript + raw-WebGPU port of Gelbox (the C++/libcinder gel electrophoresis simulator at `~/code/gelbox`) with a WebGL2 fallback, full feature parity with the C++ version, deployed as a multi-file Vite static build. This becomes the visual oracle for the eventual Rust + wgpu engine port (Phase 2/3).

**Architecture:** Two-canvas split — a main "gel" canvas runs a raw WebGPU image-graph pipeline (ping-pong render targets, six WGSL shaders ported line-by-line from the existing C++ GLSL 150 shaders); a smaller "loupe" canvas runs a Ciechanowski-style toon scene. React/Vite/Tailwind v4 from the dash template provides UI chrome. Theme tokens are read once on theme change and pushed as a uniform buffer. SVG overlay layer handles hit-testing; `@use-gesture/react` handles drag interactions. Sim runs main-thread on `Float32Array` structure-of-arrays — no Worker, no WASM at this phase.

**Tech Stack:** Node 22, React 18.3, Vite 5.4, TypeScript 5.6 (strict), Tailwind v4, react-router-dom 6.28 HashRouter (inherited from dash), raw WebGPU (`@webgpu/types`) + WebGL2 fallback (naga.wasm WGSL→GLSL ES 3.00), `@use-gesture/react`, `@texel/color`, `browser-fs-access`, Vitest 3, Playwright 1.49 with `toHaveScreenshot`.

---

## Scope

**In Phase 1:**
- Full TS port of Gelbox renderer (six shaders, all per-band passes, global overcook)
- Full TS port of GelSim (mobility, diffusion, degradation, aggregates, dyes, buffer chemistry)
- Full UI parity (gel view, sample settings, fragment editor, loupes, app settings)
- Save/load JSON, drag-drop file load
- Theme propagation to both canvases
- Visual regression suite (golden-frame harness)
- Multi-file static deployment

**Out of Phase 1 (deferred to Phase 2/3):**
- Rust engine
- Native macOS/Windows binary
- WebGPU compute path (fragment-shader blur stays — research showed compute is a regression at 5–13 tap kernels on TBR mobile GPUs)
- WASM-accelerated sim
- OffscreenCanvas + render worker
- Display-P3 / HDR

**Non-goals at any phase:**
- Server-side anything
- Login / multi-user
- Real-time collaboration
- Cloud save

---

## File structure

```
gel/
  ts/                                # Phase 1 implementation
    index.html
    package.json
    vite.config.ts
    vitest.config.ts
    playwright.config.ts
    tsconfig.json
    tsconfig.node.json
    .nvmrc
    .gitignore
    README.md
    docs/                            # Project docs (mirrored from dash)
    src/
      main.tsx
      App.tsx
      index.css                      # Tailwind v4 + @theme tokens
      vite-env.d.ts
      lib/
        theme.tsx                    # ThemeProvider + useTheme (from dash)
        color.ts                     # CSS-var → linear-RGB parsing
        gpu/
          adapter.ts                 # GPUAdapter detection + WebGL2 fallback
          surface.ts                 # Canvas + DPR + resize
          shader.ts                  # Shader compilation + hot-reload
          pipeline.ts                # Pipeline cache
          target.ts                  # RenderTarget + ping-pong helpers
          uniforms.ts                # Uniform buffer helpers
          backend/
            webgpu.ts                # WebGPU implementation
            webgl2.ts                # WebGL2 fallback (naga.wasm WGSL→GLSL)
        sim/
          gelsim.ts                  # Mobility, diffusion, degradation
          sample.ts                  # Sample/Fragment data model
          buffer.ts                  # Buffer chemistry
          dye.ts                     # Dye constants
          aggregate.ts               # Multimer distribution
          band.ts                    # Band geometry types
        gel/
          render.ts                  # Per-frame render orchestration
          passes.ts                  # Per-band pass scheduler
        rng.ts                       # Seeded RNG for flames/well-damage
      components/
        AppLayout.tsx                # Header + TabNav + Outlet + footer
        TabNav.tsx
        ThemeToggle.tsx
        gel/
          GelCanvas.tsx              # Hosts WebGPU canvas
          GelOverlay.tsx              # SVG hit-test layer
          Loupe.tsx                  # Portaled loupe widget
        sample/
          SampleView.tsx
          FragmentEditor.tsx
        chrome/
          GelSettings.tsx
          AppSettings.tsx
          DyePicker.tsx
        primitives/
          Slider.tsx
          Checkbox.tsx
          Button.tsx
      routes/
        HomePage.tsx
        GelPage.tsx                  # Main app
        DevPage.tsx                  # Dev playground (single-band tests)
      data/
        ladders.ts                   # 1kb ladder + degraded variants
        presets.ts                   # Common gel presets
        tuning.ts                    # gel-sim.json + gel-render.json ported
      shaders/
        passthrough.vert.wgsl
        blur5.frag.wgsl
        blur9.frag.wgsl
        blur13.frag.wgsl
        warp.frag.wgsl
        gel-passthrough.frag.wgsl
        toon.wgsl                    # For loupe scene (M7)
    fixtures/
      golden/                        # PNG baselines
      states/                        # Canonical sim states (JSON)
    public/
      assets/                        # Sprites, icons (copied from C++ assets/)
    tests/
      unit/                          # Vitest unit tests
        gelsim.test.ts
        color.test.ts
        rng.test.ts
        adapter.test.ts
        sanity.test.ts
      visual/                        # Playwright visual regression
        smoke.spec.ts
        single-band.spec.ts
        full-gel.spec.ts
  .github/
    workflows/
      ci.yml
  docs/
    superpowers/
      plans/
        2026-04-27-gelbox-ts-phase-1-overview.md   # this file
        2026-04-27-gelbox-ts-m1-scaffold.md        # detailed M1 plan
        # M2-M9 written just-in-time
  README.md
```

---

## Milestones

| # | Milestone | Acceptance | Plan file | Estimate |
|---|---|---|---|---|
| M1 | Scaffold + dev server | `npm run dev` shows three routes, theme toggles, all CI checks green, `/#/dev` shows live GPU capability | [`m1-scaffold.md`](2026-04-27-gelbox-ts-m1-scaffold.md) | Week 1 |
| M2 | Single-band render parity | Playwright golden-frame matches C++ reference for 1 band, all 6 passes (gradient → rect → flames → smile → well-damage → blur → composite) | [`m2-single-band.md`](2026-04-27-gelbox-ts-m2-single-band.md) | Week 2 |
| M3 | 50-band loop + global warp + 60fps | Frame profile <16ms with 50 bands at DPR 2 on Apple M1 | [`m3-multi-band.md`](2026-04-27-gelbox-ts-m3-multi-band.md) | Week 3 |
| M4 | WebGL2 fallback parity | Same goldens pass with WebGPU disabled (force-WebGL2 query param) | [`m4-webgl2-fallback.md`](2026-04-28-gelbox-ts-m4-webgl2-fallback.md) | Week 3.5 |
| M5 | GelSim + state pipeline | Voltage/time/buffer/lane sliders drive band positions correctly; goldens exist for canonical states | [`m5-gelsim.md`](2026-04-30-gelbox-ts-m5-gelsim.md) | Week 4 |
| M6 | Interaction layer | Band drag (with shift-lock), opt-drag duplicate, tab-through-fragments, modifier keys (single-lane; sample drag-between-lanes deferred to M6b) | [`m6-interaction.md`](2026-04-30-gelbox-ts-m6-interaction.md) | Week 4.5 |
| M6b | Multi-lane + sample drag | 7 lanes; microtube row; sample drag-between-lanes; alt-drag clones sample | [`m6b-multilane.md`](2026-04-30-gelbox-ts-m6b-multilane.md) | Week 4.75 |
| M7 | Loupes (UI) | Cmd-click creates a loupe popover with fragment metadata + simple particle scatter (toon-shader molecular sim deferred to M7b) | [`m7-loupes.md`](2026-04-30-gelbox-ts-m7-loupes.md) | Week 5 |
| M8 | Save/load + drag-drop | JSON round-trip (native File API), drag-drop file loading; legacy XML deferred | [`m8-saveload.md`](2026-04-30-gelbox-ts-m8-saveload.md) | Week 5.5 |
| M9 | Polish + a11y + docs | All goldens pass on both backends ✓; README + ARCHITECTURE.md done; theme-to-canvas + a11y pass deferred to M9b | [`m9-polish.md`](2026-04-30-gelbox-ts-m9-polish.md) | Week 6 |

Apply 25% buffer for solo greenfield WebGPU. Realistic ship: **7–10 weeks**.

---

## Key decisions (from research + user direction)

| Decision | Reason |
|---|---|
| Multi-file static build (`base: './'`) | Dropped single-file constraint for Gelbox; simplifies Workers/WASM if ever needed; small loupe bundle can lazy-load |
| Raw WebGPU (no Three.js / R3F) | User prefers building reusable engine. Three.js WebGPURenderer measurably slower than WebGLRenderer on unbatched workloads in 2026 |
| WebGL2 fallback via naga.wasm WGSL→GLSL | WGSL-first authoring (matches Phase 2 Rust+wgpu engine); one shader source; ES 3.00 fallback for older Safari/Firefox |
| `precision highp float` everywhere | Avoid fp16 banding in additive blur composite |
| `SRGB8_ALPHA8` ping-pong RTs | Hardware sRGB decode/encode keeps additive blend mathematically correct |
| Premultiplied alpha + `(ONE, ONE)` blend | Mathematically identical to the C++ `(SRC_ALPHA, ONE)` on unpremultiplied source; matches canvas default |
| Main-thread sim on `Float32Array` SoA | 5K mults/frame is JIT-trivial; no WASM/Worker cost worth onboarding at this phase |
| SVG overlay for hit-testing (not GPU picking) | 50 AABB-band CPU intersection is free; readPixels would be a sync stall |
| `@use-gesture/react` for drag | Ergonomic gesture state machine with modifier-key support |
| Two canvases (gel + loupe) | Isolates renderer state; both can mount/unmount independently; clean substrate for Phase 2 engine |
| `@texel/color` for token parsing | 5–125× faster than colorjs.io for OKLCH→sRGB conversion |
| Theme uniforms updated on theme change only | `getComputedStyle` is too slow for per-frame; CSS theme changes are rare |
| Vitest unit + Playwright golden-frames | Pixel diffs via SwiftShader-headless for byte-stable CI |

---

## Risk register

(Carried from research with single-file deltas applied.)

| # | Risk | Mitigation |
|---|---|---|
| 1 | Visual parity drift between C++ reference and TS port | Build golden-frame harness in M2 with a representative band set; integrate into CI; capture per-OS baselines if needed |
| 2 | mediump precision sneaking into shaders → fp16 banding on iOS | Lint rule rejecting `mediump`/`lowp`; runtime preprocessor forces `precision highp float` |
| 3 | naga.wasm WGSL→GLSL edge cases break WebGL2 fallback | Test fallback path early (M4); golden-frames in both backends |
| 4 | Safari `<a download>` and clipboard quirks | Manual QA pass on Safari macOS + iOS in M8 |
| 5 | DPR 2 + 50-band blur drops below 60fps on integrated GPUs | Profile in M3; if needed, render bands at logical resolution and bilinear-upsample on composite |

---

## Open questions

- Asset pipeline for `assets/molecules/`, `assets/slider-icons/` — copy as-is from C++ `~/code/gelbox/assets/`? Resolved during M2.
- Loupe canvas: separate WebGPU context, or render into a second region of the same canvas? Resolved during M7.
- Save format: keep C++ JSON schema as-is (best for cross-version compatibility), or extend? Resolved during M8.

---

## Sub-plans

- [x] **Phase 1 Overview** — this file
- [ ] **M1 Scaffold** — [`2026-04-27-gelbox-ts-m1-scaffold.md`](2026-04-27-gelbox-ts-m1-scaffold.md) — next-execute
- [x] **M2 Single-band render** — [`2026-04-27-gelbox-ts-m2-single-band.md`](2026-04-27-gelbox-ts-m2-single-band.md)
- [x] **M3 Many-band loop** — [`2026-04-27-gelbox-ts-m3-multi-band.md`](2026-04-27-gelbox-ts-m3-multi-band.md)
- [x] **M4 WebGL2 fallback** — [`2026-04-28-gelbox-ts-m4-webgl2-fallback.md`](2026-04-28-gelbox-ts-m4-webgl2-fallback.md)
- [x] **M5 GelSim + state pipeline** — [`2026-04-30-gelbox-ts-m5-gelsim.md`](2026-04-30-gelbox-ts-m5-gelsim.md)
- [x] **M6 Interaction layer** — [`2026-04-30-gelbox-ts-m6-interaction.md`](2026-04-30-gelbox-ts-m6-interaction.md) (single-lane subset; multi-lane sample-drag deferred to M6b)
- [x] **M6b Multi-lane + sample drag** — [`2026-04-30-gelbox-ts-m6b-multilane.md`](2026-04-30-gelbox-ts-m6b-multilane.md)
- [x] **M7 Loupes (UI)** — [`2026-04-30-gelbox-ts-m7-loupes.md`](2026-04-30-gelbox-ts-m7-loupes.md) (toon-shader molecular sim deferred to M7b)
- [x] **M8 Save/load + drag-drop** — [`2026-04-30-gelbox-ts-m8-saveload.md`](2026-04-30-gelbox-ts-m8-saveload.md) (legacy XML deferred to M9)
- [x] **M9 Polish + a11y + docs** — [`2026-04-30-gelbox-ts-m9-polish.md`](2026-04-30-gelbox-ts-m9-polish.md) (theme-to-canvas + comprehensive a11y deferred to M9b)

Each sub-plan is detail-planned just before its execution, because the design of each milestone is informed by what the previous one surfaces (especially the engine API shape).

---

## References

- C++ source: `~/code/gelbox/`
- Dash template: `~/code/dash/`
- Sandbox patterns (R3F + toon shader, fixed-timestep RAF): `~/code/ads/src/sandbox-3d/`
- Design system (Ciechanowski-inspired colors, toon shader formulas): `~/Library/CloudStorage/Dropbox-DouglasLab/Shawn Douglas/_notebook/2026/2026-01-28 ciechanoski/design-system.md`
