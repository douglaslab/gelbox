# @douglaslab/gel — Gelbox TypeScript Web Port

A web port of [Gelbox](https://github.com/douglaslab/gelbox), the gel electrophoresis simulator. TypeScript + React + raw WebGPU, with a hand-ported WebGL2 fallback.

## Status

Phase 1 (web port) ships milestones M1–M8 + M7 minimum (loupe UI). Phase 1 acceptance: a Playwright-tested interactive single-lane gel app at `/#/gel` with sliders, band drag, multi-lane sample drag, save/load, and loupes. The full plan and milestone tags live under [`docs/superpowers/plans/`](../docs/superpowers/plans/).

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
