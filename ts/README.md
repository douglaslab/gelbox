# Gelbox (web port)

TypeScript + raw WebGPU port of [Gelbox](http://www.douglaslab.org/gelbox/), the Douglas Lab gel electrophoresis simulator. WebGL2 fallback for browsers without WebGPU.

## Quick start

```sh
nvm use            # Node 22
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Command | What it does |
| - | - |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check then bundle to `dist/` |
| `npm run preview` | Serve the built `dist/` |
| `npm run typecheck` | Strict type-check, no emit |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:visual` | Playwright visual / smoke tests |

## Layout

```
ts/
  src/
    lib/gpu/         WebGPU adapter, surface, shader infra
    lib/sim/         GelSim, sample/buffer/dye data model
    lib/gel/         Gel render pass scheduler
    components/      AppLayout, TabNav, gel/, sample/, chrome/
    routes/          HomePage, GelPage, DevPage
    shaders/         WGSL sources (ported from C++ GLSL 150)
  fixtures/          Golden frames + canonical states
  tests/             unit/ (Vitest) + visual/ (Playwright)
```

## Phase 1 plan

The implementation plan lives at `../docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`. Each milestone has its own detail-plan; M1 is the scaffold (where you are now).

## License

UNLICENSED — internal Douglas Lab work.
