# Changelog

All notable changes to the Gelbox TypeScript web port. Milestones below correspond to git tags
(`m1-scaffold`, `m2-single-band`, …, `phase-1-complete`, `phase-2-complete`).

## Phase 2 — UI parity rebuild (M10 → M18) — 2026-05-09

The chrome around the gel canvas was rebuilt from generic Tailwind/React into a hand-built
three-panel stage that matches `Layout.h` line-for-line. The simulation/renderer pipeline from
Phase 1 was not touched; Phase 2 is purely the surrounding UI and the cross-panel state
contract.

### Added

- **Stage** — fixed-size 1365×768 frame anchored top-left with scale-to-fit on narrow
  viewports. Three side-by-side panel slots + brace decoration between Sample and Inspector.
  (`m11-stage-shell`)
- **Layout port** — `lib/layout/layout.ts` with every pixel position, color, and gutter from
  the C++ `Layout.h`. Asset pipeline copies slider/molecule/brace/microtube PNGs to
  `public/assets/` with DPR-aware @2x fallback. (`m10-layout-assets`)
- **Slider primitive** — `lib/slider/slider.ts` data model + `components/primitives/SliderView.tsx`
  React component supporting Style::Slider (linear), Style::Bar (filled bar), Style::Graph
  (column chart). Notches with snap/draw-only modes; quantization; custom bar fill/empty
  colors. (`m12-slider`)
- **GelView pixel parity** — re-skinned microtube row (19px tubes, 47:89 aspect, blue
  selected-lane underlay), gear settings button (M13), focus highlight on bands.
  (`m13-gelview`)
- **FragmentView ("Species")** — default inspector for fragment-level editing. 12-color
  palette + 80×80 well preview + 5 sliders (size bp, mass ng, aspect ratio, aggregate Graph
  slider, degrade). (`m14-fragment-view`)
- **SampleView middle panel** — heading + selected-lane microtube glyph + 2D
  `MolecularSimCanvas` placeholder. Particle counts use a port of
  `MolecularSim::calcTargetPop`; hover/click round-trip through `selection`/`rollover` so
  band hover lights up the matching particles and vice versa. Visual fidelity is intentionally
  minimal — Phase 3 owns the toon-shader port. (`m15-sample-view-shell`)
- **SampleSettingsView ("Buffer + Dyes")** — the right-panel inspector when a non-empty
  tube is selected. 4 Tris/Borate/Acetate/EDTA sliders + 3-button H₂O/0.5×TBE/1×TAE preset
  selector for the sample buffer; 4 dye-color Style::Bar sliders (Xylene cyanol, Cresol red,
  Bromphenol blue, Orange G). New reducer actions `SET_SAMPLE_BUFFER` and `SET_DYE_MASS`
  (lazy-creates dye fragment on first non-zero write — mirrors `Sample::setDye()`).
  (`m16-sample-settings`)
- **GelSettingsView ("Gel")** — gear-toggled inspector. 5 sliders (lanes, time/clock,
  voltage, well-damage, gel-rotate) + a re-used `BufferView` for the gel running buffer.
  New reducer actions `SET_NUM_LANES` (resizes samples array, recomputes wellRects + ySpaceScale)
  and `SET_GEL_ROTATE` (cosmetic CSS rotation on the gel canvas group). (`m17-gel-settings`)
- **Cross-panel wiring** — `selectInspectorView(state)` selector codifies the
  gel-settings → fragment → sample-settings → none decision matrix as a single function;
  `<InspectorPanel>` switches on it cleanly. End-to-end transitions verified by Playwright.
  (`m18-wiring`)
- **Drop-zone affordance** — drag a JSON file over the page and a dashed blue overlay
  appears with "Drop a sample or gel-state JSON file" guidance. (m19 polish)

### Changed

- Inspector right panel is now context-swapped (was a static slider stack in Phase 1).
- `gelState.ts` reducer extended with cross-panel `selection` / `rollover` slices and
  `inspectorMode` discriminator. `isInspectorVisible()` is now a thin wrapper around
  `selectInspectorView()`.
- Top-level `GelPage` mounts a `<Stage>` with three panels instead of the M9-era stacked
  layout; old `chrome/GelControls.tsx` and the placeholder `<Slider>` primitive are gone.

### Deferred

Items that surfaced during Phase 2 but are out of scope for it:

- **Phase 3 — molecular-sim parity.** `MolecularSimCanvas` is a placeholder; the C++
  `MolecularSim.cpp` (toon shader, Verlet physics, aggregate clustering, dye color mixing,
  loupe parity) is a multi-milestone next phase.
- **Off-preset gel buffer editing.** The gel-settings `BufferView` exposes per-ion sliders
  but the reducer's `SET_GEL_BUFFER` only accepts preset tags. A `SET_GEL_BUFFER_DIRECT`
  action is the obvious extension when off-preset editing matters.
- **SampleSettingsView visual polish.** Functional but tight — slider gutters crowd labels,
  preset-matched notches inside buffer sliders aren't rendered, the rule above the "Dyes"
  subhead is omitted. M19 polish only nibbled the edges.
- **Per-panel goldens at DPR 1 and DPR 2.** M19 ships without re-capturing the full goldens
  suite; existing per-spec goldens still pass on chromium-webgl2.

## Phase 1 — Web port (M1 → M9) — 2026-04-30

See `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md` and the per-milestone
plan files for the full Phase 1 history. Top-line: WebGPU + WebGL2 renderer parity, full
GelSim port, multi-lane interactive gel page with band drag, sample drag-between-lanes,
save/load JSON, and Cmd-click loupes.
