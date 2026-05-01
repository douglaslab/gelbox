# Gelbox TS Web Port — Phase 2 Overview (UI Parity Rebuild)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the chrome around the gel canvas to be a pixel-precise port of the C++ Gelbox UI at `/Users/shawn/code/gelbox`. Phase 1 shipped the gel **renderer + simulation + interaction** faithfully but skinned the surrounding UI with generic Tailwind/React. Phase 2 throws that chrome out and replaces it with a hand-built three-panel layout that matches `Layout.h` line-for-line: same window size, same pixel positions, same fonts, same custom-drawn sliders backed by PNG icons, same brace graphic, same microtube glyphs.

**Architecture:** A fixed-size 1365×768 stage anchored top-left of the viewport on wide screens, scaled-to-fit (with letterbox) on slightly smaller viewports, and reflowed to a **single-column responsive stack** on narrow viewports (mobile/tablet — the three panels stack vertically: gel, then sample, then inspector). Three side-by-side panels in the wide layout:

| Panel | Position | Contents |
|---|---|---|
| **Left** | `(208, 124)` size `390×520` | `GelView` — gel canvas (WebGPU/WebGL2) + microtube row + gear settings button |
| **Middle** | right of gel + `30px` gutter, size `362×520` | `SampleView` — molecular simulation (2D particle canvas) for the selected microtube |
| **Right** | right of middle + brace + gutter, size `303×520` | **Inspector** — context-swapped: `GelSettingsView` (when no microtube selected and gear pressed), `SampleSettingsView` (dye editor, when a microtube is selected and no fragment), `FragmentView` (fragment editor, when a fragment is selected) |

Chrome (sliders, buttons, headings, brace, microtube tubes, color palette) renders as **HTML/CSS over the canvas layer**, positioned absolutely against `Layout.ts` constants ported one-to-one from `Layout.h`. PNG slider icons (lo/hi pairs) and molecule glyphs ship from `public/assets/`. Avenir font is loaded as a webfont with system fallback.

**Live wiring:** Extend the existing `GelContext` reducer with two new state slices — `selection: SampleFragRef | null` and `rollover: SampleFragRef | null` — modeling the C++ `SampleFragRefRef mSelectedState, mRolloverState` shared pointers. All three panels subscribe and react: hovering a band in `GelView` writes to `rollover`, which lights up the corresponding particles in `SampleView` on the next render; clicking a particle in `SampleView` writes to `selection`, which triggers the inspector to swap to `FragmentView` and `GelView` to draw a focus highlight on the matching band. No callbacks, no mediators — the data is the channel.

**Tech Stack:** Same as Phase 1 (Vite, React 18, TS strict, WebGPU + WebGL2 fallback for the gel, Vitest + Playwright). New: **Inter** webfont (self-hosted, OFL-licensed) used everywhere `Avenir-Medium` / `Avenir-Heavy` appears in `Layout.h`, with `font-size-adjust` to bring x-height in line so the layout doesn't drift from the C++ baseline. The middle panel ("molecular simulation") is **scope-limited in Phase 2** — Phase 2 ships a minimal placeholder canvas that wires hover/select correctly across the three panels but does **not** attempt visual fidelity with the C++ `MolecularSim`. Full parity for the molecular sim (toon shader, particle physics, animations) is its own dedicated **Phase 3** with its own milestones.

---

## Scope

**In Phase 2:**
- `Layout.ts` — TypeScript port of `Layout.h` with every pixel constant, color, font, and gutter
- Asset pipeline — copy `~/code/gelbox/assets/{slider-icons,molecules,palette}` and the brace/microtube/settings/help PNGs to `ts/public/assets/`
- **Inter** webfont (self-hosted via `@fontsource/inter`) with `font-size-adjust` to approximate the Avenir x-height so layout positions stay correct
- Responsive single-column reflow at narrow widths (gel → sample → inspector stacked)
- Custom `Slider` widget (data + view) ported from `Slider.cpp` + `SliderView.cpp`, supporting all three styles (Slider/Graph/Bar), notches, snapping, quantization, lo/hi PNG icons
- Three-panel composition with brace graphic between middle and right panels
- `GelView` re-skinned: microtube row, wells, bands, focus highlight, gear settings button
- `GelSettingsView` panel — voltage, time, gel-lanes, gel-rotate, well-damage sliders + `BufferView` (Tris/Borate/EDTA + presets)
- `SampleView` middle panel **shell only** — placeholder canvas (e.g., simple 2D scatter of fragment-colored dots) sufficient to host hover/select wiring; full visual parity deferred to Phase 3
- `SampleSettingsView` panel — dye sliders (Bromphenol, Cresol, Orange G, Xylene) styled as `Style::Bar` with dye-color fills + buffer view
- `FragmentView` panel — size/concentration/aspect/aggregate(graph)/degrade sliders + `ColorPaletteView` (4-col swatch grid)
- Right-panel swap orchestration (gel-mode ↔ sample-dyes ↔ fragment-edit)
- Live cross-panel highlight wiring via shared `selection`/`rollover` state
- Visual-regression Playwright goldens for each panel, captured against the new pixel-precise layout

**Out of Phase 2 (deferred):**
- **Phase 3 — Molecular simulation parity** (its own multi-milestone phase): faithful port of `MolecularSim.cpp` + tuning JSON; toon-shader particle rendering; physics; selection/hover visual states; loupe scene parity (the M7b deferral from Phase 1 rolls into this)
- Phase 2.5 — `AppSettingsView` panel (minor toggles; not blocking parity perception)
- Phase 2.5 — theme variants and comprehensive a11y (M9b deferral from Phase 1)
- Legacy XML save format
- Image drag-drop loading (PNG → gel)
- Keyboard shortcut redesign beyond what already exists

**Non-goals:**
- Theme variants — the C++ app has one look
- Touch-first design — primary interaction model stays mouse/keyboard, but the responsive single-column layout means the page is at least viewable on touch devices

---

## File structure

```
ts/
  public/
    assets/
      slider-icons/                 # COPIED from gelbox/assets/slider-icons/
        voltage-lo.png, voltage-lo@2x.png
        voltage-hi.png, voltage-hi@2x.png
        clock-{lo,hi}{,@2x}.png
        gel-lanes-{lo,hi}{,@2x}.png
        gel-rotate-{lo,hi}{,@2x}.png
        aspect-{lo,hi}{,@2x}.png
        concentration-{lo,hi}{,@2x}.png
        size-{lo,hi}{,@2x}.png
        multimer-{lo,hi}{,@2x}.png
        well-damage-{lo,hi}{,@2x}.png
        degrade-{lo,hi}{,@2x}.png
        dye-{bromphenol-blue,cresol-red,orange-g,xylene-cyanol}-3d-{spheres,sticks}{,@2x}.png
      molecules/                    # COPIED — Tris.png, EDTA.png, Borate.png, Acetate.png, Bromphenol.png, Cresol.png, Orange G.png, Xylene.png (each + @2x)
      brace.png, brace@2x.png
      microtube1500ul.png, microtube1500ul@2x.png
      settings.png, settings@2x.png
      help.png, help@2x.png
      new-btn.png, new-btn@2x.png
      app-settings-line.png, app-settings-line@2x.png
    # Inter shipped via @fontsource/inter from npm; no PUBLIC font files needed
  src/
    lib/
      layout/
        layout.ts                   # NEW — port of Layout.h (all pixel positions, sizes, colors, font names)
        assets.ts                   # NEW — preload + scale-aware asset loader
      gel/
        gelState.ts                 # MODIFIED — add selection, rollover slices
        sampleFragRef.ts            # NEW — { laneIdx, fragIdx } | null type alias
      slider/
        slider.ts                   # NEW — port of Slider.cpp data model
        sliderView.tsx              # NEW — port of SliderView.cpp; React + HTML/CSS
    components/
      stage/
        Stage.tsx                   # NEW — 1365×768 fixed frame, scale-to-fit
        Brace.tsx                   # NEW — vertical brace graphic between middle and right
      gel/
        GelView.tsx                 # REWRITTEN — Layout-driven; hosts canvas + microtube row + gear button + focus overlay
        MicrotubeRow.tsx            # REWRITTEN — pixel-precise tubes per Layout
        GelCanvas.tsx               # REUSED — wraps WebGPU/WebGL2 renderer (no change)
      sample/
        SampleView.tsx              # NEW — middle panel; molecular sim canvas + heading + loupe
        MolecularSimCanvas.tsx      # NEW — 2D canvas particle sim
      inspector/
        InspectorPanel.tsx          # NEW — right-panel host; mounts one of three child views
        GelSettingsView.tsx         # NEW
        SampleSettingsView.tsx      # NEW — dye editor (one Style::Bar slider per dye)
        FragmentView.tsx            # NEW — fragment editor (5 sliders + color palette + well preview)
        BufferView.tsx              # NEW — buffer chemistry sliders + preset selector
        ColorPaletteView.tsx        # NEW — 4-col fragment color picker
        DyeView.tsx                 # NEW — dye row used in SampleSettingsView
      primitives/
        Slider.tsx                  # REPLACED by SliderView.tsx (delete this file)
      chrome/
        FileControls.tsx            # KEEP for now; restyle later
        GelControls.tsx             # DELETED — replaced by inspector panels
    routes/
      GelPage.tsx                   # REWRITTEN — mounts <Stage> with three panels + inspector swap
docs/
  superpowers/
    plans/
      2026-05-01-gelbox-ts-phase-2-overview.md     # this file
      2026-05-01-gelbox-ts-m10-layout-assets.md    # written before M10 starts
      # M11–M19 written just-in-time
```

---

## Milestones

| # | Milestone | Acceptance | Plan file |
|---|---|---|---|
| **M10** | Layout system + assets + selection state | `Layout.ts` matches `Layout.h` field-by-field; assets copied + scale-aware loader works; `selection`/`rollover` reducer slices land with passing tests | `m10-layout-assets.md` |
| **M11** | Three-panel stage + brace + heading + responsive reflow | `<Stage>` renders 1365×768 on wide; gel sits at `(208,124)`; middle and right panel placeholders sit at correct pixel positions; brace PNG renders between middle and right; per-panel Inter-Bold headings appear at correct baselines; **on viewports below the wide breakpoint (≤1024px), the three panels stack vertically as a single column** | `m11-stage-shell.md` |
| **M12** | Slider primitives | `slider.ts` data model matches `Slider.cpp`; `SliderView` component renders all three styles (Slider/Graph/Bar) with PNG icons, notches, snapping, quantization; round-trip drag updates value via getter/setter callbacks; unit + visual tests | `m12-slider.md` |
| **M13** | GelView pixel parity | Microtube row matches `mSampleViewMicrotubeWidth=19`, gutter, corner radius, hex colors `0xE8F2F3`/`0xA1D6FF`; gear settings button toggles GelSettingsView visibility; band hover/select draws focus overlay; existing drag/keyboard interactions intact | `m13-gelview.md` |
| **M14** | GelSettingsView panel | Voltage, clock, gel-lanes, gel-rotate, well-damage sliders rendered with correct PNG icons + Avenir labels; BufferView (Tris/Borate/EDTA bar sliders + preset rounded-corner selector) at correct sub-position; values round-trip to gelState | `m14-gel-settings.md` |
| **M15** | SampleView middle panel (shell) | Middle panel mounts when a microtube is selected, unmounts on deselect; **placeholder** 2D `MolecularSimCanvas` renders one colored dot per fragment instance (NOT visual parity — that's Phase 3); rollover/selection from shared state visibly highlights particles; hover writes back to rollover; click writes selection. Acceptance is **wiring**, not fidelity. | `m15-sample-view-shell.md` |
| **M16** | SampleSettingsView (dye editor) | Right panel shows dye list (4 rows: Bromphenol, Cresol, Orange G, Xylene); each row is a `Style::Bar` slider with dye color fill + dye PNG icon + name; values map to `GelSim::kTuning.mSliderDyeMass{Min,Max}`; BufferView for sample buffer | `m16-sample-settings.md` |
| **M17** | FragmentView (fragment editor) | Right panel shows fragment editor when a fragment is selected: size (bp, quantize 100), concentration (ng), aspect ratio, aggregate (Graph slider), degrade (3-notch); ColorPaletteView 4-col grid swaps fragment color; fragment well preview top-left | `m17-fragment-view.md` |
| **M18** | Right-panel swap + cross-panel wiring | Inspector swaps cleanly: `selection=null, microtube=null` → empty/no panel; gear pressed → GelSettingsView; `microtube ≠ null, selection=null` → SampleSettingsView; `selection ≠ null` → FragmentView. Hover band → particle lights up; click particle → inspector swaps to FragmentView; all transitions <16ms | `m18-wiring.md` |
| **M19** | Visual goldens + polish | Playwright captures per-panel goldens at DPR 1 and DPR 2 on macOS Chromium (WebGPU + WebGL2 backends); 2026-04-30 README updated with new screenshots; ARCHITECTURE.md updated; tag `phase-2-complete` | `m19-polish.md` |

Apply 25% buffer for greenfield UI work. Estimate: **6–8 weeks** total.

Each sub-plan is detail-planned just before its execution, because the design of each milestone is informed by what the previous one surfaces.

---

## Key decisions

| Decision | Reason |
|---|---|
| **HTML/CSS chrome over canvas** (not custom-drawn on a 2D canvas) | Pixel parity is achievable with absolute positioning + PNG assets; web-native; preserves accessibility hooks; faster to iterate; only the gel + molecular sim need canvas |
| **Fixed 1365×768 stage on wide, single-column reflow on narrow** | Wide layout matches `kLayout.mWindowSize` exactly. Narrow layout (≤1024px) stacks the three panels vertically as a single column so the page is usable on tablets/phones — the C++ app didn't have to handle this; the web port does. |
| **Port `Layout.h` to `layout.ts` field-by-field** | Single source of truth; future tuning matches C++ tuning JSON conventions; comments preserved |
| **Inter webfont (self-hosted)** | OFL-licensed; no Adobe Fonts dependency; ship via `@fontsource/inter` for Next/Vite-friendly subset loading; use `font-size-adjust` to bring x-height closer to Avenir so layout y-positions don't drift |
| **Shared `selection`/`rollover` reducer slices** (mirrors `SampleFragRefRef`) | One channel for cross-panel hover/select; matches C++ pattern; existing reducer extends naturally |
| **Phase 2 SampleView is a wiring shell only; visual parity in Phase 3** | The middle-panel molecular simulation is a complex piece (toon shader, particle physics) that deserves dedicated focus. Phase 2 keeps the wiring infrastructure correct so Phase 3 can drop in a faithful renderer without re-plumbing state |
| **Replace Tailwind primitives, keep Tailwind for utility classes** | Avoid wholesale rebuild; Tailwind class soup is fine for layout glue, but custom widgets (Slider, Button) become first-class components |
| **Delete `GelControls.tsx`, `Slider.tsx` (the React-Hook one)** | They were Phase 1 placeholders; replacing with inspector panels and `SliderView` |
| **Keep `Loupe.tsx` from M7 for now** | Cmd-click loupe stays as a separate concern; Phase 2 doesn't touch it |
| **Asset @2x auto-pick** | Match `Layout::uiImageWithPath` behavior — try @2x, fall back to 1x; use `window.devicePixelRatio` |

---

## Risk register

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Inter metric drift** — Inter has different x-height and advance widths than Avenir; layout positions tied to text width or baseline may shift | Use `font-size-adjust` to normalize x-height; verify each panel's heading layout in M11; if a specific position drifts >2px, adjust `Layout.ts` constant for that panel rather than fighting the font |
| 2 | **Pixel-precise targets shift between browsers** — Chrome vs. Safari kerning differs | Capture goldens per-browser; allow ±1px text positioning tolerance in tests; pin font subset |
| 3 | **State graph complexity** — three panels reading/writing shared state can race or update out of order | Single reducer; no async actions for selection/rollover; verify with React Profiler that hover updates are synchronous |
| 4 | **Slider PNG asset weight** — many lo/hi+@2x icons | All in `public/assets`, served directly; ~1MB total; preload on app boot via `assets.ts` |
| 5 | **Confusion about Phase 2 SampleView placeholder fidelity** | The middle panel will look obviously placeholder; document this clearly in M15's plan and the README so it isn't mistaken for a parity attempt. Phase 3 is explicitly scoped to molecular sim parity. |
| 5b | **Responsive reflow breaks pixel-precise tests** | Goldens captured at exactly 1365×768 (set Playwright viewport explicitly); separate goldens for narrow viewport with their own tolerances |
| 6 | **Existing Playwright goldens become stale** | Re-capture at end of each milestone; old goldens deleted, not regenerated halfway through |
| 7 | **Drag/click conflict with HTML over canvas** | Pointer events on overlay layer use `pointer-events: none` on chrome that shouldn't intercept clicks; explicit pass-through testing each milestone |
| 8 | **`Slider::Style::Graph` complexity** (multimer aggregate distribution) | Defer Graph style to M17 (FragmentView) so simpler styles are working first; reference `Slider::drawGraph()` line-by-line |

---

## Open questions

- **Loupe behavior in new layout:** Cmd-click currently spawns a portal; does it still work given the fixed stage? Resolved in M15.
- **Wide breakpoint exact value:** 1365px window minimum, but stage stops fitting comfortably below ~1280px viewport (chrome takes some). Test in M11; the breakpoint that triggers the single-column stack is a tunable constant.
- **App settings panel:** Reskin the existing settings or punt to Phase 2.5? Punt — not blocking parity perception.
- **Image drag-drop:** Phase 2 or Phase 3? Defer until after Phase 3 (molecular sim parity).

---

## Sub-plans

- [x] **Phase 2 Overview** — this file
- [x] **M10 Layout system + assets + selection state** — `2026-05-01-gelbox-ts-m10-layout-assets.md`
- [x] **M11 Stage shell** — `2026-05-01-gelbox-ts-m11-stage-shell.md`
- [x] **M12 Slider primitives** — `2026-05-01-gelbox-ts-m12-slider.md`
- [ ] **M13 GelView pixel parity** — TBD — next-execute
- [ ] **M14 GelSettingsView** — TBD
- [ ] **M15 SampleView middle panel** — TBD
- [ ] **M16 SampleSettingsView (dye editor)** — TBD
- [ ] **M17 FragmentView** — TBD
- [ ] **M18 Right-panel swap + wiring** — TBD
- [ ] **M19 Goldens + polish** — TBD

---

## References

- C++ source: `/Users/shawn/code/gelbox/`
- C++ Layout: `/Users/shawn/code/gelbox/include/Layout.h` + `src/Layout.cpp`
- C++ View base: `/Users/shawn/code/gelbox/include/View.h`
- C++ Slider: `/Users/shawn/code/gelbox/include/Slider.h` + `src/Slider.cpp` + `src/SliderView.cpp`
- C++ GelView: `/Users/shawn/code/gelbox/src/GelView.cpp` (1597 lines)
- C++ SampleView: `/Users/shawn/code/gelbox/src/SampleView.cpp` (653 lines)
- C++ FragmentView: `/Users/shawn/code/gelbox/src/FragmentView.cpp` (383 lines)
- Phase 1 final tag: `1a5b435`
- Phase 1 overview: `2026-04-27-gelbox-ts-phase-1-overview.md`

---

## Architecture summary (quoted from investigation)

> Gelbox is a three-tier hierarchical View system (left: GelView with microtubes and gel bands; middle: SampleView with molecular simulation; right: context-sensitive inspector) built on Cinder's GPU-accelerated rendering. Live wiring is achieved via shared pointer data objects (`SampleFragRef` pointers to selected/hovered fragment state) rather than callbacks — both GelView and SampleView reference the same state objects, enabling instant cross-panel synchronization without mediators.

The TS port preserves this exactly: a single `GelContext` reducer holds `selection` and `rollover` slices; every panel subscribes; data flows are unidirectional through `dispatch`.
