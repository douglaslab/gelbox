# Gelbox TS Web Port — Phase 3 Overview (Molecular Simulation Parity)

> **For agentic workers:** Use `superpowers:executing-plans` (or `subagent-driven-development`)
> to implement this plan task-by-task. Per-milestone subplans are written just before each
> milestone starts.

**Goal.** Port `~/code/gelbox/src/MolecularSim.cpp` (927 lines) and the loupe scene so the
middle "Sample" panel shows a faithful particle simulation matching the C++ Gelbox app —
not the Phase 2 placeholder dot-scatter. Phase 3 owns visual fidelity; the cross-panel
state contract (selection, rollover, inspector swap) and the surrounding layout/chrome
are already shipped in Phase 2.

**Scope.** Port the simulation step (Verlet-ish jitter motion, fade-in/out lifecycle,
spawn/cull, aggregate clustering) and the renderer (toon-shaded ellipse particles with
degradation modes — slice, shrink, randomdrop). The ports are exact — same tuning JSON,
same RNG sequences where reasonable, same pick logic. Both render backends (WebGPU
primary + WebGL2 fallback) get parity following the M4 model.

**Out of scope (deferred or never).**
- Multi-loupe loops (Phase 1's Cmd-click loupe stays as a separate concern; M26 will
  upgrade it to use the same renderer instead of the M7 portal).
- Real-time perf tuning beyond what the C++ achieves on a comparable laptop.
- Fluid simulation, water effects, anything beyond what's in `MolecularSim.cpp`.

---

## Milestone breakdown

Each milestone is independently shippable; the canvas keeps working between them, just
with less fidelity.

| # | Milestone | Acceptance | Subplan |
|---|---|---|---|
| **M20** | Particle data model + tick (pure data) | `Frag`/`Part` types ported; `setSample`/`deleteFragment` keep the parts list in sync; `tick(dt)` spawns + fades + ages + culls without any rendering. Unit-tested. | `m20-particle-data-model.md` |
| **M21** | Canvas wires up to live particles | `MolecularSimCanvas` renders `parts` (not the M15 placeholder `layoutDots`); rAF tick loop drives the sim; particle counts visibly fade in/out when masses change. Hover/click hit-tests against real parts. | `m21-canvas-live-particles.md` |
| **M22** | Aggregate / multimer rendering | `Part.mMulti[]` populated from `Frag.mAggregate`; multi-particle bonds drawn as concentric circles with the C++ `mMultimerAdhereOverlapFrac` overlap. | `m22-multimer.md` |
| **M23** | Degradation visual modes | 3 mesh-generation styles ported (`slice`, `shrink`, `randomdrop`); `mWholeness` drives which style and how strongly. | `m23-degrade-modes.md` |
| **M24** | Toon shader rendering parity | WebGPU primary + WebGL2 fallback with the same outline/fill/highlight passes the C++ uses. Replaces flat 2D circles. | `m24-toon-shader.md` |
| ~~**M25**~~ | ~~Selection / hover bloom~~ — DROPPED 2026-06-14 | Already shipped in M24: outline-behind-fill is the entire C++ selection/hover effect (C++ has no bloom shader). | — |
| **M26** | Loupe parity (replaces M7 portal) | Cmd-click loupe uses the same MolecularSim renderer at ×1 zoom-in instead of the M7 SVG portal. | `m26-loupe-parity.md` |
| **M27** | Image-as-sample drop | Drop a PNG → back-solve into a Sample (already a deferred Phase 2 idea). | `m27-image-sample.md` |

Apply the standard 25% buffer for greenfield rendering work. Estimate: 6–10 weeks total
(toon shader + degrade modes are the majority of risk).

---

## Architectural notes

**Tick loop.** `MolecularSimCanvas` will own a rAF loop that calls `molecularSim.tick(dt)`
on each frame and re-renders. The state itself stays React-managed; the sim's particle
list is an external mutable store the canvas reads but the React reducer doesn't
serialize (per-frame churn would be terrible for React's diff). M20's particle data
model lives in a plain class, not in `gelState`.

**Per-lane state.** The C++ has one global `MolecularSim`; we have one *per visible lane*
since the user can switch tubes and the sim should track each. M20 designs the
`MolecularSim` instance lifecycle: instantiate per `(lane, sample)` pair, dispose when
the lane changes, preroll on creation.

**Determinism.** Each `MolecularSim` instance seeds its RNG from `(lane, fixtureKey)` so
the particle layout is reproducible across reloads. Tests can pin RNG and compare
particle counts / positions deterministically.

**Backend parity.** Phase 1's M4 model — `lib/gel/render.ts` (WebGPU) and
`lib/gel/render-gl.ts` (WebGL2) with hand-ported shader pairs — extends to Phase 3:
M24 introduces `lib/sim/molecularSimRender.ts` + `molecularSimRender-gl.ts` with parallel
shader sources.

---

## Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | Toon shader rendering is the bulk of the visual perception of fidelity; getting it wrong costs the milestone | Capture C++ goldens before M24 starts; treat M24 as its own multi-stage milestone if needed (M24a outline pass, M24b fill, M24c highlight) |
| 2 | Per-lane MolecularSim instances + visible-lane switching = state churn | Document the lifecycle in M21; keep it simple (one instance, swap on lane change, no pooling) |
| 3 | The aggregate clustering is finicky — particles must respect bond constraints | Port the C++ `mMulti` data exactly; reference the C++ render path for visual reference |
| 4 | rAF tick rate vs. React re-render rate could create double-tick jitter | Tick the sim outside React state — keep it in a useRef-held instance, only React-render when selection/sample changes |

---

## References

- C++ source: `/Users/shawn/code/gelbox/src/MolecularSim.cpp` (927 lines)
- C++ header: `/Users/shawn/code/gelbox/include/MolecularSim.h` (193 lines)
- Tuning JSON: `/Users/shawn/code/gelbox/assets/tuning/molecular-sim.json`
- Phase 2 final tag: `phase-2-complete` (commit `6260bfd` 2026-05-09)
- Phase 2 overview: `2026-05-01-gelbox-ts-phase-2-overview.md`
- M15 placeholder: `2026-05-01-gelbox-ts-m15-sample-view-shell.md` — what M21 replaces

---

## Sub-plans

- [x] **Phase 3 Overview** — this file
- [x] **M20 Particle data model + tick** — `2026-05-09-gelbox-ts-m20-particle-data-model.md`
- [x] **M21 Canvas wires up to live particles** — `2026-05-09-gelbox-ts-m21-canvas-live-particles.md`
- [ ] **M22 Aggregate / multimer rendering** — TBD
- [ ] **M23 Degradation visual modes** — TBD
- [x] **M24 Toon shader rendering parity** — re-scoped → GPU mesh-batch renderer + sample-panel parity; `2026-06-13-gelbox-ts-m24-gpu-mesh-renderer.md` (C++ has no shader; built reusable `meshBatch` primitive)
- [x] **M25 Selection / hover bloom** — DROPPED 2026-06-14; M24's outline-behind-fill pass already is the entire C++ selection/hover effect (no bloom shader exists in C++). Blur infra left available for a future beyond-C++ effect.
- [ ] **M26 Loupe parity** — in flight; replaces M7 SVG portal with the MolecularSim renderer
- [ ] **M27 Image-as-sample drop** — TBD
