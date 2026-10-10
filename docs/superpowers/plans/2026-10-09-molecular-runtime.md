# Native Molecular Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the shared molecular-view lifetime, RNG and tick layer against all compiled native runtime sequences, ready for application integration.

**Architecture:** Preserve the numerical engine and add explicit RNG injection. A framework-independent runtime owns global/local streams and ordered view instances; document edits remain caller-owned. Application integration is the next increment and remains required for completion.

**Tech Stack:** TypeScript, Vitest, existing pinned native JSON captures; Node 22.

**Spec:** `docs/superpowers/specs/2026-10-09-molecular-runtime-design.md`.

## Global Constraints

- Strict native behavior and visual parity first; improvements afterward.
- Finish the web app first; reconsider Rust/native only for a concrete need.
- Preserve existing independently verified particle formulas and fixture APIs.
- Runtime instances own separate global RNG streams; rendering readiness never gates simulation.
- Native captures remain independent and unchanged; no new dependencies.

## Review Focus

- Same ID recreated during a tick must not cause its replacement to tick early.
- Retained removal and destroyed removal have different native snapshot behavior.
- One application instance must not affect another's random draws.
- Detail refresh must keep view-local and dynamic streams correctly copied while global preroll draws advance.
- Frozen simulation must still allow owner after-tick lifecycle work, with counters reset on sample updates.

### Task 1: Shared RNG and ordered molecular runtime

**Files:**
- Create `ts/src/lib/gel/molecularRuntime.ts`, `ts/src/lib/gel/nativeSpecies.ts`.
- Modify `ts/src/lib/sim/rng.ts`, `ts/src/lib/sim/molecularSimEngine.ts`.
- Create `ts/tests/unit/nativeRuntime.test.ts`, `ts/tests/unit/molecularRuntime.test.ts`.
- Update `docs/STATUS.md` when verified.

**Interfaces:**
- `CinderRand.clone(): CinderRand` preserves current state and cursor.
- `MolecularSimOpts.globalRand?: CinderRand`; mutually exclusive with `globalSeed`.
- `MolecularRuntime(seed = 310)` with `createView(id, {bounds, sample?, timeScale?}): MolecularView`, `getView(id): MolecularView | undefined`, `removeView(id, retain = false): MolecularView | undefined`, `raiseView(id): void`, `randomFragmentColor(): [number, number, number]`, `tick(beforeViews?: () => void): void`, ordered `views`, and test option `freezeAfter?: number`.
- `MolecularView`: `id`, `sim`, `sample`, `viewSeed`, `localRand`, `alive`, `ticks`, `frozen`, `bulletTime`, `afterTick?`; methods `createFragment`, `setInspectorOpen`, `setSample`, `refreshDetail`, `dispose` with types from the spec and existing sample/filter definitions.
- `nativeSpecies(random: CinderRand): Fragment`, `nativeFragmentColor(random: CinderRand): [number,number,number]`.

- [x] Write native fixture replay and focused lifetime/RNG/freeze tests. Compare every frame in all 16 native cases; convert native vector arrays to existing engine objects and use established particle tolerances. Assert exact species and RNG values and terminal global state via a copied RNG.
- [x] Run `PATH=/opt/homebrew/opt/node@22/bin:$PATH npm run test:unit -- tests/unit/nativeRuntime.test.ts tests/unit/molecularRuntime.test.ts` from `ts`; expect missing runtime/injection failure.
- [x] Implement the typed interfaces, six local draws with float32 arithmetic and unsigned modulo, injectable engine RNG, explicit view lifetimes and snapshot tick order. Preserve existing engine defaults for old reference callers.
- [x] Run focused tests; expect all native cases and lifetime regressions to pass without modifying native outputs.
- [ ] Run full `npm run test:unit` and `npm run build` with Node 22, native runtime Python contracts, and `git diff --check`; expect all passing. Product components are unchanged, so browser integration is explicitly not certified here.
- [ ] Commit, record verification and obtain one fresh read-only final review. Fix Important findings using failing-then-passing regressions; retain worktree for application integration.

## Decisions

- Continue inline under the active parity goal. This foundation is a dependency of the full runtime correction, not a substitute for integration or release gates.
- Self-review: one task; no cross-task interface conflicts. Each review focus maps to an explicit focused test.
