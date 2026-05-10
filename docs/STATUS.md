# Gelbox TS Web Port — Status & Next Steps

_Last updated: 2026-05-09 (after `2b946e6`)_

## Where we are

**Phase 1 complete** (renderer + simulation + interaction). Ten tags from
`m1-scaffold` through `m9-polish` shipped: WebGPU pipeline with WebGL2
fallback, full GelSim port, multi-lane interaction, loupes, save/load,
docs polish. See `MEMORY.md` for the per-milestone log.

**Phase 2 in flight** (UI parity rebuild). The plan is in
`docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md`.

| # | Milestone | Status |
|---|---|---|
| M10 | Layout + assets + selection state | ✅ shipped |
| M11 | Three-panel stage + brace + responsive reflow | ✅ shipped |
| M12 | Slider primitives | ✅ shipped |
| M13 | GelView pixel parity (microtube row, gear, focus) | ✅ shipped |
| M14 | FragmentView ("Species" — default inspector) | ✅ shipped |
| M15 | SampleView middle-panel shell | ⬜ next |
| M16 | SampleSettingsView (Buffer + Dyes) | ⬜ |
| M17 | GelSettingsView (gear-toggled "Gel" panel) | ⬜ |
| M18 | Right-panel swap + cross-panel wiring | ⬜ |
| M19 | Visual goldens + polish | ⬜ |

**Phase 3 deferred** — molecular sim visual parity (toon shader,
particle physics, animations) is its own future phase. The M15 shell is
explicitly _wiring only_, not fidelity.

### What's running today

The `/gel` route boots a real interactive page:

- **Left:** GelView with microtube row, blue underlay tab on the
  selected lane, time slider + gear button below the gel, focus
  outlines on bands, drag-to-resize physics, Tab keyboard nav, drop a
  JSON sample to load it.
- **Middle:** `SampleViewPlaceholder` — a header + empty rounded rect.
  Visible whenever `getVisibleSampleLane(state) !== null` (sticky after
  the first sample interaction).
- **Right:** `InspectorPanel` routes by mode:
  - `gel-settings` → "Gel" panel **stub** (M17 placeholder text)
  - sample selected, no fragment → "Buffer + Dyes" **stub** (M16
    placeholder text)
  - fragment selected → `FragmentView` ("Species") with palette + well
    + 5 sliders, fully working
- **Cross-panel state:** `selectedLane` / `selectedFragmentIndex` /
  `inspectorMode` / `lastSampleLane` already live in `gelState.ts`. The
  reducer slices for cross-panel hover/rollover (`rollover`,
  `selection: SampleFragRef`) exist but are wired only on the gel
  side — sample-side wiring lands with M15.

193/193 unit tests + 22/22 Playwright tests pass per backend on macOS;
typecheck clean.

---

## Next steps (in order)

### 1. M15 — SampleView middle-panel shell

**Goal.** Replace `SampleViewPlaceholder` with a real `SampleView` that:

- Mounts a 2D `<canvas>` (NOT WebGPU/WebGL2 — plain `CanvasRenderingContext2D`).
- Renders one colored dot per fragment instance — a quick scatter using
  the fragment's species color and approximate count from
  `Sample::calcNumberOfMolecules()`. Aesthetics are intentionally crude
  — Phase 3 owns the toon-shader replacement.
- Picks fragments on hover/click. Hover writes
  `dispatch({ type: 'SET_ROLLOVER', ref })`; click writes
  `dispatch({ type: 'SET_SELECTED', laneIndex, index })`.
- Reads `state.rollover` / `state.selection` and lights up the
  corresponding particles (e.g. yellow ring on hover, fragment-color
  ring on select), so `GelOverlay` band hover is visible here too.
- Honors the layout: heading "Sample" at
  `LAYOUT.sampleViewHeaderBaselinePos`; microtube glyph + selected-lane
  blue circle in the upper-left of the panel per `SampleView::drawHeader`
  (C++ `SampleView.cpp:154`).

**Files to add/modify.**

- New: `ts/src/components/sample/SampleView.tsx`
- New: `ts/src/components/sample/MolecularSimCanvas.tsx`
- Modify: `ts/src/routes/GelPage.tsx` — replace
  `<SampleViewPlaceholder />` import with `<SampleView />`.
- Delete: `ts/src/components/stage/SampleViewPlaceholder.tsx` once the
  real view is the only consumer.

**C++ references.**

- `~/code/gelbox/src/SampleView.cpp` (653 lines — most of it is the
  particle rendering we're _not_ porting in M15; focus on `mouseDown`
  at line 380, `drawHeader` at line 154, `pickFragment` calls).
- `~/code/gelbox/src/MolecularSim.cpp` is the Phase 3 target — read it
  only for the shape of `pickFragment(loc)`, not to port.

**Acceptance.** Click a band → middle panel shows colored dots, the
clicked fragment's dots are ringed, and the Species panel opens on the
right. Hovering a particle previews on the gel band. Tests include a
Playwright check that hovering a sample particle changes the band's
stroke and vice versa.

### 2. M16 — SampleSettingsView (Buffer + Dyes)

**Goal.** Replace the right-panel stub for the
`inspectorMode === 'sample-settings'` case with the real "Buffer +
Dyes" editor.

- Four `SliderView` rows in `Style::Bar`, one per dye (Bromphenol,
  Cresol, Orange G, Xylene), with the dye color as the bar fill and the
  dye PNG icon at the row's lo/hi ends.
- A `BufferView` block above the dyes for the **sample's** buffer
  (Tris/Borate/EDTA bar sliders + preset selector — the same widget
  M17 will reuse for the gel buffer).
- Slider values map to `GelSim::kTuning.mSliderDyeMass{Min,Max}` and
  round-trip through `dispatch({ type: 'SET_FRAGMENT_MASS', ... })` for
  the dye fragment in the sample.

**Files to add.**

- `ts/src/components/inspector/SampleSettingsView.tsx`
- `ts/src/components/inspector/BufferView.tsx`
- `ts/src/components/inspector/DyeRow.tsx`

**Files to modify.** `ts/src/components/inspector/InspectorPanel.tsx` —
swap the stub for `<SampleSettingsView />`; drop the M16 placeholder
text.

**C++ reference.** `~/code/gelbox/src/SampleSettingsView.cpp` (201
lines — short and self-contained).

**Acceptance.** Clicking a non-empty tube opens "Buffer + Dyes"; moving
a dye slider visibly changes the corresponding band on the gel
(re-simulates and re-renders). Buffer preset clicks update sample
buffer chemistry. 4 dyes × 3 buffer ions wired.

### 3. M17 — GelSettingsView ("Gel" gear-toggled panel)

**Goal.** Replace the right-panel stub for
`inspectorMode === 'gel-settings'` (already toggled by the gear button
shipped in M13) with the real Gel-settings editor.

- Sliders: voltage, time/clock, gel-lanes, gel-rotate, well-damage —
  five `Style::Slider`s with the corresponding lo/hi PNG icon pairs
  from `public/assets/slider-icons/`.
- A `BufferView` block (re-used from M16) for the **gel running
  buffer**.
- Values dispatch to `gelState`: `SET_VOLTAGE`, `SET_TIME`,
  `SET_WELL_DAMAGE`, `SET_GEL_BUFFER` already exist; `gelLanes` and
  `gelRotate` actions are new (rotate is cosmetic — visual rotation of
  the gel canvas).

**Files to add.** `ts/src/components/inspector/GelSettingsView.tsx`.

**Files to modify.** `gelState.ts` — add `SET_NUM_LANES`, `SET_GEL_ROTATE`
actions. `InspectorPanel.tsx` — swap the stub.

**C++ reference.** `~/code/gelbox/src/GelSettingsView.cpp` (232 lines).

**Acceptance.** Pressing the gear button reveals the Gel panel. All
five sliders + buffer presets round-trip through the reducer. Voltage
and time changes re-run the sim immediately (already wired); lane
count change reflows the microtube row.

### 4. M18 — Right-panel swap + cross-panel wiring

**Goal.** Tighten the orchestration of which inspector panel shows
when. The `inspectorMode` reducer slice already exists; this milestone
is about edge cases, transitions, and the cross-panel state contract.

- Decision matrix codified as a single `selectInspectorView(state)`
  selector and tested.
- Hover band → particle highlights in SampleView (M15 wires the
  forward path; M18 verifies the round-trip with goldens).
- Click particle → inspector swaps to FragmentView (already partly
  wired through `SET_SELECTED`; verify with a sample-particle
  Playwright case).
- Transitions are synchronous (<16ms — single reducer dispatch, no
  async).

**Acceptance.** Playwright suite covering: gear-on with no selection,
gear-on with selection (gear wins), tube click, band click, band Tab
nav, particle click. All transitions captured as goldens.

### 5. M19 — Visual goldens + polish

**Goal.** Tag `phase-2-complete`. Capture per-panel goldens at DPR 1
and DPR 2 for both backends (WebGPU + WebGL2) on macOS Chromium.
Refresh README screenshots. Update `ARCHITECTURE.md` for the three-panel
stage + inspector swap. Add a CHANGELOG entry.

---

## Open polish items (not blocking M15)

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
