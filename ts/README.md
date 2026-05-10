# @douglaslab/gel — Gelbox TypeScript Web Port

A web port of [Gelbox](https://github.com/douglaslab/gelbox), the gel electrophoresis simulator. TypeScript + React + raw WebGPU, with a hand-ported WebGL2 fallback.

## Status

**Phase 1** (M1–M9): renderer + simulation + interaction core. WebGPU primary path with hand-ported WebGL2 fallback, full GelSim port, multi-lane interaction, loupes, save/load.

**Phase 2** (M10–M18): three-panel UI parity rebuild. Pixel-precise port of `Layout.h`; custom slider primitive with Style::Slider/Bar/Graph; left panel (gel + microtube row + time slider + gear); middle panel (placeholder MolecularSimCanvas wiring sample ↔ gel hover/select); right panel (context-swapped: "Species" fragment editor / "Buffer + Dyes" sample settings / "Gel" gel settings).

**Phase 3** (deferred): faithful molecular-sim render parity (toon shader, particle physics, aggregate clustering, loupe parity).

The full plan and per-milestone subplans live under [`docs/superpowers/plans/`](../docs/superpowers/plans/); current state is in [`docs/STATUS.md`](../docs/STATUS.md).

## Quick start

```sh
nvm use                # Node 22
npm install
npm run dev            # http://localhost:5173
```

Open `http://localhost:5173/#/gel` for the interactive app, or `/#/dev/{multi,perf,sim}` for renderer-isolated dev pages.

## Commands

| | |
|---|---|
| `npm run dev`              | Vite dev server |
| `npm run build`            | Production build → `dist/` |
| `npm run typecheck`        | `tsc --noEmit` |
| `npm run test:unit`        | Vitest |
| `npm run test:visual`      | Playwright (both backend projects) |
| `npm run test:visual:update` | Update PNG goldens |

## Backends

The app ships two render backends:

- **WebGPU** (preferred). Used by default when `navigator.gpu` is available.
- **WebGL2** (fallback). Hand-ported GLSL ES 3.00 mirrors all eight WGSL shaders.

Force a backend via URL hash query (`/#/gel?backend=webgl2`) or `localStorage.gelBackend = 'webgl2'`. Linux CI runs the WebGL2 path; WebGPU on Linux chromium is too unreliable. See `docs/superpowers/plans/2026-04-28-gelbox-ts-m4-webgl2-fallback.md`.

## Architecture

See [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the rendering pipeline, sim, state model, and file map.

## Plans

Detailed implementation plans for each milestone live under [`docs/superpowers/plans/`](../docs/superpowers/plans/), and each shipped milestone has a git tag (`m1-scaffold`, `m2-single-band`, …, `m7-loupes`, `m8-saveload`).
