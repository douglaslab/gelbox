# M20 — Particle data model + tick (no rendering)

> **Phase 3, Milestone 20.** First concrete step toward molecular-sim parity.
> Pure-data port of `~/code/gelbox/src/MolecularSim.cpp`'s tick + lifecycle —
> no rendering, no React state. M21 will wire `MolecularSimCanvas` to a live
> instance; M20 just establishes the engine.

**Parent plan:** `2026-05-09-gelbox-ts-phase-3-overview.md`
**C++ refs:** `MolecularSim.cpp:120-475` (setBounds, calcTargetPop,
setSample, deleteFragment, preroll, tick, randomPart, pickPart, pickFragment).

---

## Files

**New:**
- `ts/src/lib/sim/molecularSimEngine.ts` — `MolecularSim` class + `Frag`/
  `Part`/`PartMulti` types + `MOLECULAR_SIM_TUNING` constants.
- `ts/tests/unit/molecularSimEngine.test.ts` — 14 unit tests.

**Not modified yet:**
- `ts/src/components/sample/MolecularSimCanvas.tsx` still uses the M15
  placeholder `layoutDots`. M21 swaps it.
- The M15 `lib/sim/molecularSim.ts` placeholder helpers stay in place
  for now (they're still referenced by the canvas + some tests).

---

## Scope

The engine owns:
- **Frag profiles** — per-fragment radius/color/wholeness/aggregate weights,
  computed from a `Sample`. `setSample()` reconciles. `deleteFragment()`
  fades out the doomed fragment's particles and reindexes the rest.
- **Part lifecycle** — spawn one per tick when `alivePop < targetPop`,
  cull stochastically when `alivePop > targetPop`, fade in/out via
  `kTuning.mFadeInStep` / `mFadeOutStep`.
- **Movement** — `loc += vel * dt + jitter`. Out-of-bounds → marked dead.
- **Multimers** — at spawn, build a multimer chain whose size is sampled
  from `frag.aggregate` weights. Each `Part.multi` holds normalized
  offsets and per-multimer angles.
- **Picking** — `pickPart(x, y)` iterates back-to-front, tests every
  multimer's rotated ellipse for hit. `pickFragment(x, y)` collapses the
  picked part to its fragment index.

## Out of scope

- **Rendering.** Phase 3 M21–M25 owns the visual layer. M20 is pure data.
- **Aggregate cull edge cases.** The C++ `aggregateCullChanceScale` /
  `mAggregateCullPopEps` are ported but the cull condition matters mostly
  for visual stability over long runs; not exercised under unit tests.
- **Bullet-time / variable timestep.** The `tick(dt)` parameter is wired
  but nothing currently exercises non-1 dt.
- **Sample.cpp's `setDyes()` round-trip math.** Dye fragments produce
  `targetPop = 0` here (matches C++); dye visualization stays on the
  band path.

## Tasks (all completed)

- [x] **20.1** Port `MolecularSimTuning` constants → `MOLECULAR_SIM_TUNING`.
- [x] **20.2** Define `FragState`, `Part`, `PartMulti` types.
- [x] **20.3** Implement `MolecularSim` class: setBounds, setSample,
      deleteFragment, tick (census + dither + spawn + cull + per-part
      update + fade-cull), preroll, pickPart, pickFragment.
- [x] **20.4** Add `basesToRadius` helper (lerp 0..baseCountHigh →
      radiusMin..radiusMax).
- [x] **20.5** 14 unit tests covering setSample reconciliation,
      tick spawn+grow+shrink, dye → 0, preroll force-faded,
      determinism (same seed → same particle count), deleteFragment
      reindex, pick + sizeDensityScale.

## Decisions

- **Engine is a class, not a reducer.** Per-tick particle churn would
  thrash React's diff. The canvas (M21) will hold the instance in a
  `useRef`, run rAF-driven ticks, and only React-render when the
  selection or sample shape changes.
- **Per-tick popRand reseeded from constructor seed.** Matches C++
  semantics — dithering is reproducible across runs.
- **Lifetime: one engine per (lane, sample) pair.** M21 instantiates
  on lane change, calls `preroll(100)` once, then ticks per frame.
- **`tick(dt)` signature.** C++ passes a `bulletTime` boolean; we
  expose `dt` directly (default 1) so tests can step. The
  `bulletTimeScale` constant is in tuning if a UI ever wants it.
- **Aggregate weights store as `number[]`.** Already what `Sample`
  uses. We compute `aggregateWeightSum` once at setSample.

## Decisions deferred to M21+

- **rAF tick rate.** Match the gel's animation cadence. May skip ticks
  to keep wall-clock equivalent across slow frames.
- **Per-lane vs. global engine.** The Sample slot is currently sticky
  (one visible lane at a time). One engine per visible lane is
  conceptually simpler but burns memory; one shared engine that
  re-runs `setSample` on lane change is cheaper. M21 will pick.
