# Sandbox engine architecture

The implementation companion to [`sandbox-design.md`](sandbox-design.md).
Where the design doc frames *what* a sandbox is, this doc documents *how*
the engine is structured — the patterns that made a worked-example particle
sandbox cheap to extend, and the ones that, in retrospect, would make the
next engine cheaper still.

Audience: anyone extending a sandbox engine, building a sibling engine for
a new sim genre, or forking an engine to keep an old demo running while a
new one ramps up.

Read [`sandbox-design.md`](sandbox-design.md) first. The design rules there
decide what kind of engine you need; this doc decides how to build it.

---

## 1. Aim

Three reasons this doc exists:

1. **The engine is a deliverable, not just a means.** ParticleSandbox
   started as the engine for `CompetingClocks` and ended up driving four
   sims, then a unified `/sandbox` page. The design doc's §4 ("the
   development tool becomes the toy") names the pattern; this doc
   documents the architectural decisions that made it possible.
2. **Forks happen.** The `placement/sandboxEngine.tsx` →
   `sandbox/engine.ts` fork preserved an active demo while a new engine
   ramped up. The next fork will be cheaper if the seam is documented.
3. **State shape is spec.** The `SandboxState` type tells you what the
   sandbox does more reliably than any prose summary. Cite the type from
   prose, don't paraphrase it.

---

## 2. Two-clock implementation discipline

The design doc §4 names the SimCity dual-clock pattern: a fast UI clock
(60Hz) and a slow simulation clock (user-controlled). ParticleSandbox
already has this latent — particle Brownian motion runs on the RAF clock,
the time slider controls a separate sim-clock. The implementation
discipline that keeps the two from leaking:

**Tag every input prop with the clock it rides on.** In the engine API:

```ts
interface EngineInputs {
  // RAF-clock inputs (change at frame rate; engine never re-initializes on these)
  playing: boolean;

  // Sim-clock inputs (user controls; engine reacts but does not re-initialize)
  hmdsStickiness: number;
  emitRate: number;

  // Setup inputs (change at construction; engine resets on these)
  patches: Patch[];
  rules: SurfaceRules;
}
```

The rule: sim-clock changes never touch the integrator step; RAF drift
never touches sim-clock state. If a parameter is moving at 60Hz, it rides
RAF. If the user dials it, it rides sim-clock. If it's the geometry the
simulation is operating on, it's setup and a change resets the engine.

**Why this matters in practice.** Without the discipline, a slider hooked
to "stickiness" causes the integrator to re-init every render, and the
simulation visibly stutters. With the discipline, the slider biases the
existing dynamics smoothly.

---

## 3. Single-engine-state, multiple-renderers

The placement sandbox shows top + front views of the same scene. They are
not two separate engines with synchronized state — they are one engine with
two projections.

**The pattern:** the engine produces a single `EngineResult` (particles,
patches, derived halos, fold parameters). Renderers are pure functions of
that result. Each renderer picks the projection (top vs front) and the
visual primitives (SVG circles for particles in top view, SVG ellipses
projected through the foldT for front view).

**No state in renderers.** This is the load-bearing claim. If a renderer
caches anything, the two views drift on different frames. Renderers may
memoize on engine result identity; they may not memoize on time.

**Why "two views beat one" works at all.** The design doc §3 calls out
linked-view displays (gel + loupe, top + front, world + minimap) as a
structural move. The architectural reason it works in this codebase:
sharing the engine state makes the second view free. The second view costs
only its render code, not its physics. Without single-state, you're
maintaining two simulations and the linkage will eventually slip.

**Generalisations.** Any linked-view pair fits:
gel-band-and-molecular-loupe in Gelbox, map-and-cross-section in geology
dashboards, world-and-minimap in games. The same architectural rule.

---

## 4. The engine fork seam

The engine API is what you preserve when you fork. Everything else can
diverge.

**API surface (preserve across forks):**

- `EngineInputs` — the typed prop bag described in §2.
- `EngineResult` — particles, patches, derived halos, `foldT`,
  `landingFold`, any per-frame readouts the renderers consume.
- The `useSandboxEngine(inputs): EngineResult` hook signature — call shape
  and return shape stable across forks.

**Internal (free to diverge):**

- The RAF loop and frame scheduling.
- The particle pool and integrator step.
- Physics constants (HMDS hydrolysis time, screening lengths,
  pKa-conditioned grab strengths).
- Any caches, memoization, worker offloading, or time-slicing.

**Worked example: `placement/sandboxEngine.tsx` → `sandbox/engine.ts`.**
The fork preserved the `EngineInputs`/`EngineResult` shapes (with
extensions: `SandboxState` widened the input bag). The internals diverged:
the new engine added the dual-clock discipline (§2), refactored particle
storage into a typed array, and added the `landingFold` derivation. The old
engine kept driving `/placement` for two weeks while the new one ramped up.

**The seam in code.** A single file (`src/sandbox/engine.ts`) exports the
hook; a sibling file (`src/sandbox/state.ts`) defines `SandboxState` and
the input/result types. Anyone forking copies these two files first, then
the inspector and renderers, then diverges.

---

## 5. State shape as the spec

The `SandboxState` type is the most readable description of what the
sandbox does. More readable than any prose summary. Type definitions
deserve to be cited from docs.

```ts
// src/sandbox/state.ts (excerpt — see file for the full type)
export interface SandboxState {
  chipId: string | null;
  designId: string | null;
  surfaceChem: SurfaceChem;
  surfaceGrab: number;       // 0..1, snaps from surfaceChem default
  rigidity: number;          // 0..1, origami stiffness
  hmdsStickiness: number;
  emitRate: number;
  rinseAt: number | null;    // action-as-timestamp (design doc rule 17)
  // ...
}
```

Read this type before you read any prose about the sandbox. The names are
load-bearing.

**Recipe for keeping the type and the prose in sync as the engine evolves:**

1. When you add a field, add a `// doc:` comment that says where it should
   appear in [`principles.md`](principles.md) or
   [`sandbox-design.md`](sandbox-design.md) if anywhere.
2. When you remove a field, grep the docs for the field name and update
   any references.
3. When the meaning of a field changes, update the JSDoc on the type
   first, then the docs.

The type is the source of truth.

---

## 6. References

- [`sandbox-design.md`](sandbox-design.md) — the sandbox design playbook.
- [`principles.md`](principles.md) — the dashboard layer above this engine.
- A worked-example engine source lives in a sibling project under
  `src/sandbox/engine.ts`, with its types in `src/sandbox/state.ts` and its
  variations registry in `src/sandbox/presets.ts` (the
  variations-as-data pattern from the design doc rule 16). The predecessor
  engine, preserved as the fork source, lives at
  `src/placement/sandboxEngine.tsx` (the fork-before-refactor pattern from
  [`principles.md`](principles.md) principle 15).
