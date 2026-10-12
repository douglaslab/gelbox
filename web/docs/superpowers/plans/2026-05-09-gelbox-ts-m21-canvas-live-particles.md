# M21 — Canvas wires up to live MolecularSim engine

> **Phase 3, Milestone 21.** Replace the M15 placeholder `layoutDots`
> with a live `MolecularSim` engine. Particles spawn / fade / drift over
> time; the canvas polls the engine each rAF frame.

**Parent plan:** `2026-05-09-gelbox-ts-phase-3-overview.md`
**Depends on:** M20 (`molecularSimEngine.ts`).

---

## Files

**Modified:**
- `ts/src/components/sample/MolecularSimCanvas.tsx` — new engine-backed
  rendering path. The M15 `layoutDots`/`pickDot` imports are gone;
  particles come from `simRef.current.parts`. Picking calls
  `engine.pickFragment()`.
- `ts/tests/visual/sample-view.spec.ts` — test that polled the
  `data-dot-count` attribute now polls `data-alive-count` (the engine's
  live alive-particle count, exposed for e2e).

**Not changed:**
- `ts/src/lib/sim/molecularSim.ts` — the M15 placeholder file still
  exists with `calcTargetPop` / `linearRgbToSrgbHex` / `pickDot` etc.
  used elsewhere. M22+ may consolidate.

## Lifecycle

The engine lives in a `useRef` so per-frame ticks don't re-render React.
- Construct on first render (seed = laneIndex × 31 + 1 for determinism).
- `setBounds` on width/height/lane change.
- `setSample` + `preroll(60)` on sample shape change.
- rAF loop ticks the engine and bumps a render counter (`setTick`)
  which forces React to re-draw — the actual rendering is in the draw
  effect, which runs on every render and consults `simRef.current.parts`.

## Acceptance

- The Sample panel shows live particles with size scaled by fragment
  base count (per `basesToRadius`).
- Hovering a particle dispatches `SET_ROLLOVER` → the matching gel band
  goes yellow.
- Clicking a particle dispatches `SET_SELECTED` → inspector swaps to
  Species for that fragment.
- Particle count grows + holds at the targetPop range as the engine
  prerolls + ticks.
- 248/248 unit + 7/7 sample-view + inspector-wiring e2e tests pass on
  chromium-webgl2.

## Decisions

- **One engine per visible lane.** Lane changes are rare; throwing
  away the engine + recreating on lane switch is fine. (We can pool
  later if it matters.)
- **`setTick` counter forces redraw.** Could call
  `requestAnimationFrame(draw)` from outside React but mixing rAF
  callbacks with React state proved trickier than just re-rendering.
- **Multimer rendering: each multi slot draws as one ellipse.** Multi
  offsets are in radius units; we translate by `m.loc * radius`,
  rotate by `p.angle + m.angle`, then scale to draw a unit circle.
  That's effectively "M22 lite" — the slots show, but no inter-bond
  visualization. M22 will tighten the look.

## Open polish (M22+)

- Multimer bonds aren't rendered as connected groups — each multi
  slot is just a separate dot.
- Selection ring scales with radius, which can look chunky on big
  10kb fragments. M25 (bloom) will replace this with the toon-shader
  outline pass.
- Fade-in/out transitions are visible per-particle but the population
  growth from preroll is instant; M21 doesn't smooth the population
  curve, just snap it.
