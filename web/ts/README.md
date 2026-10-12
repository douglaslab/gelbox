# @douglaslab/gel — Gelbox TypeScript Web Port

A web port of [Gelbox](https://github.com/douglaslab/gelbox), the gel electrophoresis simulator. TypeScript + React + raw WebGPU, with a hand-ported WebGL2 fallback.

## Status

The web app is released as a beta. Native-file interoperability, editing,
rendering and browser reliability have extensive retained regression coverage;
remaining detailed native/platform parity checks continue during beta.

The canonical source now lives at `web/ts/` in the native Gelbox repository.
Run the commands below from that directory. See the [web overview](../README.md),
[roadmap](../docs/ROADMAP.md), [status](../docs/STATUS.md), and
[parity ledger](../docs/PARITY-LEDGER.md) for evidence and remaining limitations.

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

The default visual gate starts its own fresh Vite server on `127.0.0.1:5187`
with strict port ownership. It does not reuse a running development server: HMR
module timestamps can split fixture contexts and bypass module interception.
`GEL_BASE_URL` explicitly targets an already-running server for diagnostics;
use a fresh server for acceptance runs.

## Backends

The app ships two render backends:

- **WebGPU** (preferred). Used by default when `navigator.gpu` is available.
- **WebGL2** (fallback). Hand-ported GLSL ES 3.00 mirrors all eight WGSL shaders.

Force a backend via URL hash query (`/#/gel?backend=webgl2`) or `localStorage.gelBackend = 'webgl2'`. Linux CI runs the WebGL2 path; WebGPU on Linux chromium is too unreliable. See `docs/superpowers/plans/2026-04-28-gelbox-ts-m4-webgl2-fallback.md`.

## Architecture

See [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for the rendering pipeline, sim, state model, and file map.

## Plans

Historical implementation plans live under [`docs/superpowers/`](../docs/superpowers/README.md), with milestone tags recording prior delivery. Tags and TS golden tests do not certify native parity. Future implementation plans should follow the P0–P5 gates in [ROADMAP.md](../docs/ROADMAP.md).
