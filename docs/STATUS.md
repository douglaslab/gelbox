# Gelbox TS Web Port — Status & Next Steps

_Last updated: 2026-05-09 (after M16 SampleSettingsView)_

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
| M15 | SampleView middle-panel shell | ✅ shipped |
| M16 | SampleSettingsView (Buffer + Dyes) | ✅ shipped |
| M17 | GelSettingsView (gear-toggled "Gel" panel) | ⬜ next |
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
- **Middle:** `SampleView` — "Sample" heading + selected-lane blue circle
  + microtube glyph in the upper-left, hosting a 2D `MolecularSimCanvas`
  that scatters one fragment-colored dot per particle (count from
  `MolecularSim::calcTargetPop`). Hover/click on a dot dispatches
  `SET_ROLLOVER` / `SET_SELECTED`; rings on dots reflect both
  `state.selection` and the per-lane `selectedFragmentIndex`. Visual
  fidelity is intentionally minimal — Phase 3 owns the toon-shader port.
  Visible whenever `getVisibleSampleLane(state) !== null` (sticky after
  the first sample interaction).
- **Right:** `InspectorPanel` routes by mode:
  - `gel-settings` → "Gel" panel **stub** (M17 placeholder text)
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

## Next steps (in order)

### 1. M17 — GelSettingsView ("Gel" gear-toggled panel)

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

### 2. M18 — Right-panel swap + cross-panel wiring

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

### 3. M19 — Visual goldens + polish

**Goal.** Tag `phase-2-complete`. Capture per-panel goldens at DPR 1
and DPR 2 for both backends (WebGPU + WebGL2) on macOS Chromium.
Refresh README screenshots. Update `ARCHITECTURE.md` for the three-panel
stage + inspector swap. Add a CHANGELOG entry.

---

## Open polish items (not blocking M17)

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
