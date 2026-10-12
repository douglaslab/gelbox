# M16 — SampleSettingsView (Buffer + Dyes)

> **Phase 2, Milestone 16.** Replace the right-panel stub for
> `inspectorMode === 'sample-settings'` with a real "Buffer + Dyes" editor.
> Acceptance: clicking a non-empty tube opens "Buffer + Dyes"; dragging a
> dye slider visibly adds a dye band to the gel; clicking a buffer preset
> rewrites the sample's buffer. 4 dyes × 4 buffer ions × 3 presets, all
> wired through the gelState reducer.

**Parent plan:** `2026-05-01-gelbox-ts-phase-2-overview.md`
**C++ refs:** `~/code/gelbox/src/SampleSettingsView.cpp` (201 lines, full
port), `~/code/gelbox/src/BufferView.cpp` (350 lines — preset matching +
slider construction), `~/code/gelbox/src/Sample.cpp:171` (`setDye()`
lazy-create logic).

---

## Files

**New:**
- `ts/src/components/inspector/SampleSettingsView.tsx`
- `ts/src/components/inspector/BufferView.tsx`
- `ts/src/components/inspector/DyeRow.tsx`
- `ts/tests/unit/sampleSettings.test.ts`
- `ts/tests/visual/sample-settings.spec.ts`

**Modified:**
- `ts/src/components/primitives/SliderView.tsx` — accept optional
  `barFillColor`, `barEmptyColor`, `barCornerRadius`, `barHeight` props so
  Style::Bar sliders can be styled per dye color.
- `ts/src/components/inspector/InspectorPanel.tsx` — swap M16 stub for
  `<SampleSettingsView />`.
- `ts/src/lib/gel/gelState.ts` — add `SET_SAMPLE_BUFFER` and `SET_DYE_MASS`
  actions.

## Tasks

- [x] **16.1** Read existing `SliderView` + `slider.ts` to confirm Style::Bar
      rendering.
- [x] **16.2** Confirm `public/assets/molecules/{Tris,Borate,Acetate,EDTA,
      Xylene,Cresol,Bromphenol,Orange G}.png` already exist (they do).
- [x] **16.3** Build `BufferView`: 4 sliders bound to Buffer fields, 3-button
      preset row matching via `bufferEquals`.
- [x] **16.4** Build `DyeRow`: name label + Style::Bar slider with dye color
      fill, dye PNG icon at the high end, mass formatter.
- [x] **16.5** Build `SampleSettingsView`: heading "Buffer + Dyes",
      `<BufferView />`, "Dyes" subhead, 4 `<DyeRow />` rows.
- [x] **16.6** Add `SET_SAMPLE_BUFFER` (writes `samples[lane].buffer` and,
      for the selected lane, `ctx.sampleBuffer` so the solver picks it up)
      and `SET_DYE_MASS` (lazy-creates the dye fragment on first non-zero
      write — mirrors `Sample::setDye(dye, val)` which pushes a new
      fragment when the dye isn't present).
- [x] **16.7** Tests:
      - Unit: 10 reducer tests covering both new actions, including
        lazy-create, no-op-on-empty-lane, no-op-on-zero-when-missing,
        and dye index isolation.
      - Playwright: 3 e2e tests — panel opens on tube click, preset
        clicks select, dragging a dye slider lazy-creates a band on the
        gel.
- [x] **16.8** Wire into InspectorPanel; typecheck + 219/219 unit pass +
      3/3 new e2e pass on chromium-webgl2.

## Decisions

- **Lazy-create dye fragments.** Following C++ `Sample::setDye()`: a
  zero-mass write when no dye fragment exists is a no-op. A non-zero
  write creates the fragment with sane defaults (bases=1, aspect=1,
  no aggregate, the dye's color). Once created, the fragment stays in
  the sample (mass can be set back to 0 without removing it). Keeps
  reducer logic monotonic.
- **`SliderView` extension over a new BarSliderView.** The existing
  Style::Bar branch already renders the fill+label correctly; just
  needed optional color/radius/height props. No new component needed.
- **Visual fidelity is intentionally not pixel-perfect.** Layout
  positions are close to the C++ values but the panel is somewhat
  cramped because we're using dye name labels (≤ 14 chars) where C++
  used dye glyph icons on the left. Tracked under "Open polish items"
  in STATUS.md.

## Open polish (deferred to M19)

- Re-balance the dye/buffer slider row gutters so labels don't crowd the
  track.
- Render preset-matched notches inside each buffer slider.
- Add a thin rule line above "Dyes" subhead at `sampleSettingsRuleTopLeft`.
