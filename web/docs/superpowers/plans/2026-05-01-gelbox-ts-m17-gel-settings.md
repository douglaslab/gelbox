# M17 — GelSettingsView (gear-toggled "Gel" panel)

> **Phase 2, Milestone 17.** Replace the right-panel stub for
> `inspectorMode === 'gel-settings'` with a real Gel-settings editor.
> The gear button (shipped in M13) toggles the mode; M17 puts a real
> panel behind it.

**Parent plan:** `2026-05-01-gelbox-ts-phase-2-overview.md`
**C++ ref:** `~/code/gelbox/src/GelSettingsView.cpp` (232 lines).

---

## Files

**New:**
- `ts/src/components/inspector/GelSettingsView.tsx`
- `ts/tests/unit/gelSettings.test.ts`
- `ts/tests/visual/gel-settings.spec.ts`

**Modified:**
- `ts/src/lib/gel/gelState.ts` — add `SET_NUM_LANES` (resizes samples
  array + recomputes wellRects + ySpaceScale) and `SET_GEL_ROTATE`
  (cosmetic gel canvas rotation).
- `ts/src/components/inspector/InspectorPanel.tsx` — swap the M17 stub
  for `<GelSettingsView />`. Drop unused PanelShell + ModeStub helpers.
- `ts/src/routes/GelPage.tsx` — wrap the gel canvas + overlay in a div
  whose `transform: rotate(...)` reflects `state.gelRotate`.

## Tasks (all completed)

- [x] **17.1** Read C++ GelSettingsView reference and tuning constants.
- [x] **17.2** Add `SET_NUM_LANES` + `SET_GEL_ROTATE` reducer actions.
- [x] **17.3** Build `GelSettingsView` with 5 sliders + BufferView.
- [x] **17.4** Wire into `InspectorPanel`; apply `gelRotate` to the gel
      canvas via CSS `transform: rotate(...)`.
- [x] **17.5** Tests: 8 unit (NUM_LANES grow/shrink/clamp/round/no-op +
      ySpaceScale recompute, GEL_ROTATE positive/negative); 5 e2e
      (panel opens, voltage drag, lane count slider, gel buffer preset,
      gear toggles closed).

## Tuning constants ported

From `~/code/gelbox/include/GelSim.h` + `assets/tuning/gel-sim.json`:
- `mSliderTimelineMaxMinutes = 180` (3 hrs)
- `mSliderVoltageLow/High/Notch = -300 / 300 / 70`
- `mSliderNumLanesMin/Max = 7 / 20`
- `mSliderGelRotateMax = 20°`

## Decisions

- **Gel buffer slider**: M17 ships a 3-button preset selector matching
  `BUFFER_TBE` / `BUFFER_TAE` / `BUFFER_H2O` (re-using `BufferView`
  from M16). Off-preset gel buffers (per-ion sliders) are deferred —
  the reducer's `SET_GEL_BUFFER` only accepts preset tags and adding a
  `SET_GEL_BUFFER_DIRECT` action wasn't blocking acceptance.
- **gel-rotate is cosmetic.** Per the C++ reference (mEnabled=false),
  rotation isn't wired into the simulation. Our port renders it as a
  CSS rotation around the top-centre of the gel canvas+overlay group,
  so wells stay anchored to the microtube row.
- **Voltage notches at 0V and 70V.** The C++ adds notches at 0 and the
  default voltage with `Notch::Snap`. Our SliderView passes the same
  notches as normalized 0..1 positions and snap behavior.
- **Lane count change preserves data.** When growing, new lanes are
  null. When shrinking, samples beyond the new count are dropped (with
  `selectedLane` clamped). `wellRects` and `ctx.ySpaceScale` recompute.

## Open polish (deferred to M19)

- The dye/buffer panel layouts share the BufferView component but the
  gel-settings BufferView sits at a different `topLeft` and we don't
  re-tune the dye-row gutter — alignment is "close enough" not pixel
  perfect.
- The gel-rotate slider has no visual feedback in the gel canvas's
  numeric annotations (e.g. tilt indicator at edges).
- The gel-settings BufferView only edits the gel buffer via presets;
  per-ion sliders inside it are inert there because the reducer rejects
  non-preset values. Deferred along with `SET_GEL_BUFFER_DIRECT`.
