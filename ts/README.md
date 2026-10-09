# @douglaslab/gel — Gelbox TypeScript Web Port

A web port of [Gelbox](https://github.com/douglaslab/gelbox), the gel electrophoresis simulator. TypeScript + React + raw WebGPU, with a hand-ported WebGL2 fallback.

## Status

The web implementation reached historical milestone **M26a**: gel simulation/rendering, three-panel editing, live molecular particles, and synthetic-sample loupes are implemented. Native behavior and visual parity are **not complete**: file controls are disconnected, native file compatibility and editing workflows are missing, and rendering/interaction differences remain.

The confirmed goal is **strict native behavior and visual parity first; improvements afterward**. Finish the web app first; reconsider Rust/native only for a concrete need.

Start with the replacement [roadmap](../docs/ROADMAP.md), [current status](../docs/STATUS.md), and [parity audit](../docs/PORT-AUDIT.md). The old phase plans are historical references. The next increment establishes a runnable native reference and an independent parity test corpus.

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

Historical implementation plans live under [`docs/superpowers/`](../docs/superpowers/README.md), with milestone tags recording prior delivery. Tags and TS golden tests do not certify native parity. Future implementation plans should follow the P0–P5 gates in [ROADMAP.md](../docs/ROADMAP.md).
