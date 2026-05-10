# M15 — SampleView middle panel (shell)

> **Phase 2, Milestone 15.** Replaces the `SampleViewPlaceholder` middle slot
> with a real `SampleView` whose job is **wiring**, not visual fidelity. The
> faithful molecular-sim renderer (toon shader, particle physics, animations)
> is a Phase 3 concern. Acceptance is cross-panel hover/select round-tripping,
> not pixel parity with the C++ MolecularSim.

**Parent plan:** `2026-05-01-gelbox-ts-phase-2-overview.md`
**C++ refs:** `~/code/gelbox/src/SampleView.cpp` (drawHeader L154, mouseDown L380),
`~/code/gelbox/src/MolecularSim.cpp` (calcTargetPop L128, pickFragment L502),
`~/code/gelbox/include/Layout.h` (mSampleView*).

---

## Goals

1. Mount a 2D `<canvas>` (`CanvasRenderingContext2D` only — **not** WebGPU/WebGL2)
   that scatters fragment-colored dots inside the middle panel rect.
2. Per-fragment dot count follows the C++ formula
   `count = round(min(mass/175, 1)^0.5 * 50)` from `MolecularSim::calcTargetPop`
   with `mSampleMassHigh = 175`, `mNumPartsPerMassHigh = 50`, `mNumPartsExp = 0.5`.
   (Already in `GEL_SIM_TUNING.sampleMassHigh`; the other two are M15-local
   constants since Phase 3 will own the full tuning port.)
3. Each dot is the fragment's species color (linear-RGB → sRGB hex, same
   conversion `GelOverlay` already uses).
4. Hover a dot → `dispatch({ type: 'SET_ROLLOVER', ref: { lane, fragmentIndex } })`.
   Leave → `SET_ROLLOVER, ref: null`.
5. Click a dot → `dispatch({ type: 'SET_SELECTED', laneIndex, index })`. (Inspector
   automatically swaps to FragmentView via the existing reducer logic.)
6. Read `state.rollover` / `state.selection` and **ring** the matching dots:
   - `selection` match → black `mSampleViewFragSelectColor` ring (already in `LAYOUT`).
   - `rollover` match (when not also selected) → yellow `mSampleViewFragHoverColor` ring.
7. Header: heading text "Sample" at `LAYOUT.sampleViewHeaderBaselinePos` plus the
   blue selected-lane circle and microtube glyph in the upper-left, mirroring
   `SampleView::drawHeader()`.

## Out of scope

- No physics, no Verlet integration, no aggregate clustering, no degrade
  visualization, no toon shader, no fade-in/out animation. **All Phase 3.**
- No loupe parity (Phase 1 M7's portal stays as-is).
- No microtube background dye-tint (`drawBackground` mixes dye colors into the
  bg — Phase 3 will port that).
- No image-as-sample drag (Phase 3+).

## Non-goals

- Pixel parity with `MolecularSim` rendering. The dots are obviously placeholder
  geometry — flat circles, no aggregate multimers, no jitter motion.

---

## Files

**New:**
- `ts/src/components/sample/SampleView.tsx`
- `ts/src/components/sample/MolecularSimCanvas.tsx`
- `ts/src/lib/sim/molecularSim.ts` — pure function `calcTargetPop(mass)` + a
  deterministic dot-layout helper (`layoutDots(rect, fragments, seed)`).
- `ts/src/components/sample/__tests__/MolecularSimCanvas.test.tsx`
- `ts/src/lib/sim/__tests__/molecularSim.test.ts`
- `ts/tests-e2e/sample-view-wiring.spec.ts`

**Modified:**
- `ts/src/routes/GelPage.tsx` — swap `SampleViewPlaceholder` for `SampleView`.

**Deleted (after the swap is verified):**
- `ts/src/components/stage/SampleViewPlaceholder.tsx`

---

## Tasks

- [ ] **15.1** Add `calcTargetPop(mass)` + `layoutDots(...)` to
      `lib/sim/molecularSim.ts`. Layout is deterministic: a seeded RNG
      (`mulberry32` style — already used elsewhere in `lib/sim/rng.ts`?) seeded by
      `(lane * 31 + fragmentIndex)` lays out N points uniformly in the panel
      rect with a configurable padding. Same inputs → same output (so visual
      tests are deterministic).
- [ ] **15.2** Unit tests for `calcTargetPop`:
      - `mass=0 → 0`
      - `mass=175 → 50` (all-the-way-up, 175/175=1, 1^0.5=1, 1*50=50)
      - `mass=43.75 → 25` (¼ of high, sqrt(0.25)*50 = 25)
      - `mass=350 → 50` (clamped at 1 before the pow)
- [ ] **15.3** Build `MolecularSimCanvas.tsx`:
      - Renders a 2D canvas sized to the middle panel rect minus the heading band.
      - Subscribes to `state.samples`, `state.lastSampleLane`, `state.rollover`,
        `state.selection`.
      - Re-lays-out + redraws when sample fragments / selection / rollover change.
        Use `useEffect` with deps; canvas redraw is just `clearRect` + N circles.
      - Pointer handlers on the canvas: `pointermove` → hit-test against laid-out
        dots, dispatch `SET_ROLLOVER`; `pointerleave` → `SET_ROLLOVER null`;
        `pointerdown` (primary button) → `SET_SELECTED { laneIndex, index }`.
      - DPR-aware: draw at `canvas.width = cssW * dpr; ctx.scale(dpr, dpr)`.
- [ ] **15.4** Build `SampleView.tsx`:
      - Heading text "Sample" at the layout baseline, same Inter style as the
        other panels (mirror `SampleViewPlaceholder` heading verbatim).
      - Selected-lane blue circle (radius `sampleViewMicrotubeBkgndRadius=20`,
        gutter `sampleViewMicrotubeBkgndGutter=11`) at the panel's upper-left
        corner. Color is `gelMicrotubeBkgndColorSelected = #A1D6FF`.
      - Microtube glyph PNG (`/assets/microtube1500ul.png`) inside the circle —
        re-use `MicrotubeRow`'s sizing constants (microtube width 19, height
        derived from the PNG aspect 47:89 — see commit `532043b`).
      - Mounts `<MolecularSimCanvas />` filling the rest of the panel.
      - Background: rounded rect `LAYOUT.molecularSimBkgndColor` matching the
        placeholder.
- [ ] **15.5** Replace `SampleViewPlaceholder` in `GelPage.tsx`. Delete the
      placeholder file.
- [ ] **15.6** Vitest: `MolecularSimCanvas.test.tsx`:
      - Renders inside `<GelProvider>` with a fixture sample.
      - Asserts the laid-out dot count == sum of `calcTargetPop(frag.mass)` over
        all non-dye fragments. (Expose the layout function for direct testing,
        not just the canvas.)
      - Asserts `pointerdown` on a dot's centre dispatches `SET_SELECTED` with
        the right indices (using the deterministic layout to compute coords).
- [ ] **15.7** Playwright: `sample-view-wiring.spec.ts`:
      - Load the page with the default ladder fixture, click a band on lane 0,
        verify a dot ring appears in the SampleView panel.
      - Hover a dot in SampleView, verify the gel band's stroke goes yellow.
      - Click a dot in SampleView (a different fragment) → inspector swaps to
        Species view for that new fragment.
- [ ] **15.8** Run the verification suite: `pnpm typecheck`, `pnpm test`,
      `pnpm playwright test`. Update `docs/STATUS.md` to mark M15 ✅ shipped and
      bump the "Last updated" line.

---

## Acceptance

- A user opens `/gel`, clicks a band on lane 0. Middle panel shows the
  "Sample" heading + blue circle + microtube glyph + a scatter of colored
  dots (about 30-50 per fragment depending on mass). Selected fragment's dots
  are ringed black. The Species inspector is open on the right.
- Hovering a band on the gel rings the corresponding sample dots in yellow.
- Hovering a sample dot makes the gel band's stroke go yellow (already wired
  through `SET_ROLLOVER`; sample side is the new direction).
- Clicking a sample dot for a different fragment swaps the right inspector
  to that fragment.
- 193+ unit + 22+ Playwright tests pass per backend on macOS (existing tests
  must not regress).

## Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | Pointer events on the canvas conflict with `Stage` slot's div absolute positioning. | Use `pointer-events: auto` on the canvas; verify clicks land via the e2e test. |
| 2 | Dot count of 50/fragment × 7 fragments × 7 lanes = 2450 hit-test ops per pointermove → jank. | Only one lane shows at a time (`lastSampleLane`); typical sample has 5-7 fragments × ~30 dots = 200 hit-tests. Acceptable; revisit if Phase 3 inflates counts. |
| 3 | Determinism: tests need to know dot positions. | Seed RNG by `(lane, fragmentIndex)`; expose `layoutDots` for testing. |
| 4 | DPR doubling makes hit-test math wrong. | Hit-test in CSS-pixel space; only `setTransform(dpr, ...)` for the draw, not for event coords. |

