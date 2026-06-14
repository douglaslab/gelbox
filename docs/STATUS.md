# Gelbox TS Web Port — Status & Next Steps

_Last updated: 2026-06-13 (Phase 2 complete + Phase 3 M20–M24 shipped; M25 needs re-eval)_

## Where we are

**Phase 1 complete** (renderer + simulation + interaction). Ten tags from
`m1-scaffold` through `m9-polish` shipped: WebGPU pipeline with WebGL2
fallback, full GelSim port, multi-lane interaction, loupes, save/load,
docs polish. See `MEMORY.md` for the per-milestone log.

**Phase 2 complete** (UI parity rebuild). The plan is in
`docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md` with
each milestone shipped to `main`. M19 polish landed the drop-zone
affordance + ARCHITECTURE/README/CHANGELOG updates; the rest of the
visual polish list is captured under "Open polish items" below for
Phase 3 to clean up alongside the molecular-sim port.

| # | Milestone | Status |
|---|---|---|
| M10 | Layout + assets + selection state | ✅ shipped |
| M11 | Three-panel stage + brace + responsive reflow | ✅ shipped |
| M12 | Slider primitives | ✅ shipped |
| M13 | GelView pixel parity (microtube row, gear, focus) | ✅ shipped |
| M14 | FragmentView ("Species" — default inspector) | ✅ shipped |
| M15 | SampleView middle-panel shell | ✅ shipped |
| M16 | SampleSettingsView (Buffer + Dyes) | ✅ shipped |
| M17 | GelSettingsView (gear-toggled "Gel" panel) | ✅ shipped |
| M18 | Right-panel swap + cross-panel wiring | ✅ shipped |
| M19 | Visual goldens + polish | ✅ shipped (partial — see notes) |

**Phase 3 in flight** — molecular-sim visual parity. Plan:
`docs/superpowers/plans/2026-05-09-gelbox-ts-phase-3-overview.md`.

| # | Milestone | Status |
|---|---|---|
| M20 | Particle data model + tick (no rendering)        | ✅ shipped |
| M21 | Canvas wires up to live MolecularSim engine      | ✅ shipped |
| M22 | Multimer offset + connected rendering             | ✅ shipped |
| M23 | Degradation rendering (slice mode)               | ✅ shipped |
| M24 | GPU mesh-batch renderer + sample-panel parity    | ✅ shipped |
| M25 | Selection / hover bloom (NEEDS RE-EVAL — see notes) | ⬜ |
| M26 | Loupe parity (replaces M7 portal)                | ⬜ |
| M27 | Image-as-sample drop                             | ⬜ |

### What's running today

The `/gel` route boots a real interactive page:

- **Left:** GelView with microtube row, blue underlay tab on the
  selected lane, time slider + gear button below the gel, focus
  outlines on bands, drag-to-resize physics, Tab keyboard nav, drop a
  JSON sample to load it.
- **Middle:** `SampleView` — "Sample" heading + selected-lane blue circle
  + microtube glyph in the upper-left, hosting a 2D `MolecularSimCanvas`
  backed by a live `MolecularSim` engine (Phase 3 M20+M21+M22). Each
  fragment spawns N ≈ `calcTargetPop(mass)` particles with size
  proportional to base count; multimers cluster with C++
  `mMultimerAdhereOverlapFrac` overlap. rAF tick loop runs the spawn /
  fade / cull / jitter cycle. Hover/click hit-tests against
  `engine.pickFragment()` and dispatches `SET_ROLLOVER` / `SET_SELECTED`.
  As of M24 the panel renders through the GPU (WebGPU primary, WebGL2
  fallback) via the reusable `meshBatch` primitive: dye-tinted background
  with idle/hover/down highlight states, slice-degraded particle meshes,
  and outline-behind-fill selection/rollover. A 2D-canvas fallback covers
  no-GPU environments. Visible whenever `getVisibleSampleLane(state) !==
  null` (sticky after the first sample interaction).
- **Right:** `InspectorPanel` routes by mode:
  - `gel-settings` → `GelSettingsView` ("Gel"): voltage, time/clock,
    well-damage, lanes, and rotate sliders (rotate is cosmetic — applied
    as a CSS rotation on the gel canvas group), plus a `BufferView` for
    the gel running buffer (3 presets: H₂O / ½× TBE / 1× TAE). Lane
    count slider grows/shrinks the microtube row + samples array.
  - sample selected, no fragment → `SampleSettingsView` ("Buffer + Dyes"):
    H₂O / ½× TBE / 1× TAE preset selector, 4 Tris/Borate/Acetate/EDTA
    Style::Bar sliders (round-tripped via `SET_SAMPLE_BUFFER`), 4
    dye-color Style::Bar sliders for Xylene cyanol / Cresol red /
    Bromphenol blue / Orange G (round-tripped via `SET_DYE_MASS` which
    lazy-creates the dye fragment on first non-zero write — mirrors
    `Sample::setDye()` in C++).
  - fragment selected → `FragmentView` ("Species") with palette + well
    + 5 sliders, fully working
- **Cross-panel state:** `selectedLane` / `selectedFragmentIndex` /
  `inspectorMode` / `lastSampleLane` already live in `gelState.ts`. The
  reducer slices for cross-panel hover/rollover (`rollover`,
  `selection: SampleFragRef`) exist but are wired only on the gel
  side — sample-side wiring lands with M15.

209/209 unit tests pass; typecheck clean. The 4 new M15 Playwright tests
in `tests/visual/sample-view.spec.ts` pass on chromium-webgl2 on macOS.
A small set of pre-existing Playwright failures (stage layout, gel-page
selection-info, fragment-view) survives from earlier milestones — those
are tracked separately and not regressed by M15.

---

## Where work was left (autonomous session, 2026-05-09 night)

In one autonomous session the agent shipped M15 → M22 (Phase 2 close-out
+ first three Phase 3 milestones) directly to `main`. Each milestone is
a separate commit with a milestone-style message; the `phase-2-complete`
tag is at commit `6260bfd`. The agent's intentional sequence:

1. **M15** SampleView shell + MolecularSimCanvas placeholder
2. **M16** SampleSettingsView (Buffer + Dyes)
3. **M17** GelSettingsView (gear-toggled "Gel")
4. **M18** Cross-panel wiring + `selectInspectorView` selector
5. **M19** Polish: drop-zone affordance + ARCHITECTURE/README/CHANGELOG
6. *Phase 3 begins*
7. **M20** MolecularSim engine (data + tick, no rendering) — port of
   `MolecularSim.cpp` lifecycle, 14 unit tests
8. **M21** MolecularSimCanvas wires up to the live engine — replaces
   M15 placeholder with rAF-driven particle rendering
9. **M22** Multimer offset math fix + cluster rendering matches C++

**248/248** unit tests + **all new e2e** pass on chromium-webgl2;
typecheck clean.

## Decisions made autonomously (worth reviewing)

- **Direct commits to `main`** rather than per-milestone PRs. Matches
  the established repo pattern (recent fix(gel) commits).
- **M16 visual polish was deferred** — the panel is functional but
  labels crowd the slider tracks. See "Open polish items" below.
- **M17 off-preset gel buffer editing was deferred** — `BufferView`
  per-ion sliders dispatch `SET_GEL_BUFFER` which only takes preset
  tags. A `SET_GEL_BUFFER_DIRECT` action is the obvious extension.
- **M19 per-panel goldens were not re-captured** — those snapshots
  drift on different machines and are noise without human review.
  Capture before starting Phase 3 M24 (toon shader work).
- **Phase 3 M22 was a minimal correctness fix** rather than a full
  multimer-bonds-and-clusters rendering pass. The C++ doesn't draw
  explicit bonds — particles just overlap. The TS port now matches.

## Next steps (in order)

### 1. Phase 3 M25 — RE-EVALUATE before implementing

M24 revealed that C++ `MolecularSim` has **no bloom shader** — the
outline-behind-fill pass *is* the C++ selection/hover effect, and M24
already ships it. So "M25 bloom" as originally planned is largely a
no-op. Decide one of: (a) drop M25, or (b) redefine it as a deliberate
*beyond-C++* glow (now cheap on the GPU substrate — add a blur pass on
the selected-particle mesh via the existing blur pass infra). Not yet
scoped; brainstorm before starting.

### Done: Phase 3 M24 — GPU mesh-batch renderer + sample-panel parity

Spec `docs/superpowers/specs/2026-06-13-gelbox-ts-m24-gpu-mesh-renderer-design.md`;
plan `docs/superpowers/plans/2026-06-13-gelbox-ts-m24-gpu-mesh-renderer.md`.

**Re-scoped from "toon shader".** Reading the C++ showed `MolecularSim`
uses no GLSL shader — just flat-colored `TriMesh`es via Cinder immediate
mode, with the "toon" outline done as an inflated mesh drawn behind the
fill. So M24 became: extract a **reusable WebGPU+WebGL2 2D mesh-batch
primitive** (`lib/gpu/meshBatch.ts` + `gl/meshBatch.ts`) out of the gel
renderer's geometry pass, and make the sample panel its first consumer.
Rationale: reusable GPU capability for the component library + headroom
for future effects — not new pixels (output matches the prior 2D canvas).

- The gel renderer (`primitives.ts`, `render-gl.ts`) was refactored to
  consume `meshBatch` too — verified pixel-neutral (gel goldens
  unchanged on both backends).
- New pure modules: `molecularSimMesh.ts` (port of `makeMoleculesMesh`
  + `makeMesh_slice`, slice clip = C++ area-preserving `2·wholeness²−1`),
  `molecularSimBackground.ts` (port of `drawBackground`), `layout/color.ts`.
- **sRGB/parity resolved empirically:** WebGPU vs WebGL2 goldens differ
  by 1–2 px / 188,760 (0.001%); both render correct vibrant colors. The
  earlier worry that the GPU paths render dark did not manifest.
- Visual goldens (idle/selected/dyed × both backends) made deterministic
  via a test-only freeze hook (`window.__molsimFreezeAfterTicks`) since
  the rAF sim is animated.
- `combineMeshes` is duplicated in `primitives.ts` and `render-gl.ts`
  (byte-identical) — a noted follow-up to hoist into `lib/gel/mesh.ts`.
- 263 unit pass; full Playwright suite 49 pass / 1 skip / 0 fail on both
  chromium-webgpu and chromium-webgl2.

### Done: Phase 3 M23 — Degradation rendering (slice mode) — `dddf469`

Particles render with `Part::makeMesh_slice` semantics: the unit
ellipse is clipped to a left-anchored rect of width `2 * wholeness²`,
preserving ~`wholeness²` of visible area (matches C++
`makeDegradeIntersectShape`). `wholeness` is populated by M20's
`setSample` (`clamp(1 - degrade/2, 0, 1)`) and lerped each tick.
Floor `sliceWidth = max(0.05, wholeness²)` keeps fully-degraded
particles pickable; the selection ring is drawn around the full
undeformed ellipse (matches C++). The other two C++ degrade modes
(`shrink`, `randomdrop`) are commented out in C++ production and were
intentionally not ported. 248/248 unit pass; typecheck clean.

### M19 closeout (legacy section — kept for reference)

**Goal.** Tag `phase-2-complete`. Capture per-panel goldens at DPR 1
and DPR 2 for both backends (WebGPU + WebGL2) on macOS Chromium.
Refresh README screenshots. Update `ARCHITECTURE.md` for the three-panel
stage + inspector swap. Add a CHANGELOG entry.

---

## Open polish items (not blocking M18)

- **SampleSettingsView spacing.** M16 ships with the panel functional
  but visually tight: dye/buffer labels crowd the bar tracks, and the
  notch row dots aren't drawn at the C++ "matched preset" positions.
  Phase 2 polish (M19) should re-tune `bufferViewSlidersTopLeft` and
  the row label gutter for breathing room.
- **Sample buffer ↔ ctx.sampleBuffer drift.** `ctx.sampleBuffer` is only
  used by `solver.ts`; we update it for the selected lane only. If the
  user changes a buffer on a non-selected lane, ctx is not refreshed
  until they return to that lane. Acceptable for now — revisit if the
  solver path picks up new buffer-aware behavior.
These accumulated during recent rounds of visual feedback. Worth a
sweep but not phase-critical:

- **Drop-zone affordance.** Drag-and-drop of `.json` samples works but
  there's no visible drop target. Consider a dashed outline on
  `dragenter` over `<GelPage>`.
- **Empty-tube affordance.** Clicking an empty tube selects the lane
  but doesn't open the Inspector (correct behavior — no sample to
  inspect). Confirm this is what we want or add a "drop a sample
  here" hint.
- **Time slider "Sat." / hour formatting.** The C++ shows hours as
  whole numbers up to 4h max; ours shows `H:MM`. Pick one once the
  Gel-settings clock slider lands in M17.
- **Loupe parity.** Cmd-click loupe works (Phase 1 M7) but uses a
  generic 2D portal, not the C++ molecular-sim loupe. Re-evaluate
  whether to upgrade in Phase 3 or leave as-is.

---

## Phase 3 (post M19)

Owned solely by molecular-sim visual parity:

1. Port `MolecularSim.cpp` (927 lines): toon-shader particle render,
   physics (Verlet + collision), aggregate clustering, dye visuals,
   selection/hover bloom.
2. Port the loupe scene to use the same renderer (replaces M7 portal).
3. Image-as-sample loading (drop a PNG to back-solve into a Sample).

Plan stub when M19 is done; not needed before then.
