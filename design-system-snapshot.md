# Design System Snapshot — Gelbox

> Up-front orientation for the brand designer: **Gelbox is not a web app.** It is a native macOS desktop application written in C++ on top of libCinder (an OpenGL-based creative-coding framework). There is no HTML, no CSS, no Tailwind, no React, no design-token JSON. What "design system" exists lives as struct fields in a single C++ header (`include/Layout.h`) plus a few inline palettes. This report extracts those values into something a designer can read.

---

## 1. Inventory

| Aspect | Value |
|---|---|
| Framework | **libCinder 0.9.0** (creative-coding C++ framework over OpenGL) |
| Renderer | OpenGL 3.3, MSAA 4× on macOS |
| Build | Xcode project (`xcode/Gelbox.xcodeproj`) |
| Entry point | `src/GelboxApp.cpp` (`CINDER_APP` macro) |
| Bundle ID | `org.douglaslab.*` (recently renamed from `org.libcinder.*`) |
| Window | 1365 × 768 default, resizable, HiDPI/Retina-aware (`@2x` PNGs) |
| Min macOS | `${MACOSX_DEPLOYMENT_TARGET}` (set in Xcode build settings) |
| Styling stack | None of the usual web tooling. All UI is drawn imperatively (`gl::drawSolidRect`, `gl::draw`, etc.) |
| Token file | **`include/Layout.h`** — the single source of truth (and `src/Layout.cpp`) |
| Domain palettes | `include/Dye.h` (4 dye colors), `src/FragmentView.cpp` (12-color species picker) |
| Tuning data | `assets/tuning/*.json` (gel-render, gel-sim, molecular-sim — mostly numeric simulation params, not visual tokens) |
| Sample / palette data | `assets/palette/*.xml` (1kb-ladder fragment colors as inline hex) |
| Shaders | `assets/shaders/` — `passthrough.vert`, `gel-passthrough.frag`, `warp.frag`, `blur5/9/13.frag` (Jam3 Gaussian kernels, MIT) |
| Design source files | `design/` — original `.sketch` files (AppIcon, dyes, Buffer view, Fragment view, Gel Icons, Gel sim visual features, New app design) |

There is no `theme/`, `tokens/`, `design-system/`, `styles/`, or `ui/` directory. There is no Tailwind config, no CSS file, no font config, no shadcn / Radix / MUI / Mantine. Everything visual is either a struct field in `Layout.h` or a PNG in `assets/`.

---

## 2. Colors

The codebase has only one mode (light). There is no dark mode and no theming layer. Tokens are not split into "raw" and "semantic" tiers — they are named per-component (e.g. `mFragViewWellFill`, `mBufferViewSliderTextLabelColor`), so every value below is effectively semantic. All hex values are reproduced as 6-digit RGB.

### 2a. UI / chrome palette (`include/Layout.h`)

| Token | Hex | Role |
|---|---|---|
| `mGelMicrotubeBkgndColor` | `#E8F2F3` | Microtube panel background (idle) — pale blue-green |
| `mGelMicrotubeBkgndColorSelected` | `#A1D6FF` | Microtube panel background (selected) — saturated sky blue |
| `mMolecularSimBkgndColor` | `#F1F1F2` | Sample (molecular sim) panel background |
| `mRuleColor` | `#C4C4C4` | Horizontal rules / dividers |
| `mCheckboxColor` | `#979797` | Checkbox stroke |
| `mAppSettingsButtonColor` | `#CCCCCC` (`Color::gray(.8)`) | App-settings button outline |
| `mFragViewWellStroke` | `#BDBDBD` | "Well" rectangle stroke |
| `mFragViewWellFill` | `#F1F1F1` | "Well" rectangle fill |
| `mFragViewWellShadow` | `#F0F0F0` | "Well" drop-shadow tint (offset 0, 4) |
| `mBtnHoverColor` | `#E6E6E6` (`gray(.9)`) | Button — hover |
| `mBtnDownColor` | `#B3B3B3` (`gray(.7)`) | Button — pressed |
| `mDebugDrawLayoutGuideColor` | `#18BFFF` | Layout debug overlay (developer only) |

### 2b. Slider palette

| Token | Hex | Role |
|---|---|---|
| `mSliderLineColor` | `#979797` | Track line |
| `mSliderHandleColor` | `#4990E2` | Handle fill — Cinder accent blue |
| `mBufferViewSliderEmptyColor` | `#E8EBF1` | Bar slider empty fill |
| `mBufferViewSliderFillColor` | `#AEB6C3` | Bar slider filled portion |
| `mBufferViewSliderTextLabelColor` | `#777777` | Slider label text |
| `mBufferViewSliderTextValueColor` | `#333333` (`gray(.2)`) | Slider numeric readout (e.g. "89.0 mM") |

### 2c. Buffer-preset palette (segmented control)

| Token | Hex | Role |
|---|---|---|
| `mBufferViewPresetsColor` | `#979797` | Preset segmented-control stroke + dividers |
| `mBufferViewPresetsFontColor` | `#2B2B2B` | Preset label text |
| `mBufferViewPresetsSelectColor` | `#FFDC73` | Selected segment highlight — warm yellow (the only warm hue in the chrome) |

### 2d. Typography color tokens

| Token | Hex | Role |
|---|---|---|
| `mHeadFontColor` | `#7F94AC` | Section headers ("Gel", "Sample", "Species") — muted slate-blue |
| `mSubheadFontColor` | `#000000` | Subheads (e.g. "Buffer") |
| `mUIFontColor` | `#777777` | Body / label text |

### 2e. Domain palette A — Fragment / species color picker (12-color)

Defined inline in `src/FragmentView.cpp::FragmentView::sColorPalette`. Exposed in the UI as a 4 × 3 swatch grid; users assign one of these to each DNA fragment "species" they place on the gel.

| Hex | Approximate name |
|---|---|
| `#0066CC` | Blue |
| `#CC0000` | Red |
| `#F74308` | Vermilion |
| `#F7931E` | Orange |
| `#AAAA00` | Olive |
| `#57BB00` | Lime |
| `#007200` | Forest |
| `#03B6A2` | Teal |
| `#1700DE` | Deep blue |
| `#7300DE` | Purple |
| `#B8056C` | Magenta |
| `#333333` | Near-black |

The same 12-color set is reused as inline `<Color value="…"/>` entries in `assets/palette/1kbladder.xml` for the bundled 1kb-ladder sample.

### 2f. Domain palette B — Tracking-dye chemistry colors (4-color)

Defined in `include/Dye.h::Dye::kColors`. Colors of the four real-world tracking dyes that the gel simulator can model.

| Dye | Hex | Approximate name |
|---|---|---|
| Xylene cyanol | `#00AFE2` | Cyan |
| Cresol red | `#985D93` | Mauve |
| Bromphenol blue | `#B3A7D3` | Lavender |
| Orange G | `#FACB01` | Saffron yellow |

These four colors are *not* coordinated with the UI palette or with the species palette — they are chosen to match the visible color of the chemical reagents themselves.

---

## 3. Typography

A single family loaded from the macOS system. There is no `@font-face`, no Google Fonts, no `next/font`, no licensing artifact.

| Role | Family / weight | Size (pt) | Color |
|---|---|---|---|
| `mHeadFont` (section header) | **Avenir-Heavy** | 24 | `#7F94AC` |
| `mSubheadFont` | **Avenir-Heavy** | 12 | `#000000` |
| `mUIFont` (body / labels / values) | **Avenir-Medium** | 12 | `#777777` |
| `mBufferViewSliderLabelFont` | Avenir-Medium | 12 | `#777777` |
| `mBufferViewPresetsFont` | Avenir-Medium | 12 | `#2B2B2B` |

- **Two weights only**: Heavy (headings) and Medium (everything else).
- **Two sizes only**: 24 pt and 12 pt.
- No italic. No monospace anywhere — numeric readouts use the same Avenir-Medium 12 as labels.
- No tabular-numerals, no letter-spacing tokens, no defined line-height. Text is rendered via Cinder's `TextLayout` / `TextureFont`. There is an in-source comment acknowledging line-spacing is loose ("we haven't gotten the text line spacing as tight as we wanted" — `Layout.h`, near `mSampleSettingsContentOffset`).
- No CJK / multilingual / RTL setup. UI strings are hard-coded English.

---

## 4. Spacing, radii, shadows, motion

### Spacing (points)

There is no spacing scale. Every gutter is a one-off literal in `Layout.h`. The recurring values are:

- Heading-to-content gutter: **25**
- Button-to-edge / button-to-button gutter: **16**
- App-settings: first-widget gutter **32**, item v-offset **28**
- Slider v-offset (sample / buffer panels): **31**
- Slider v-offset (fragment panel): **56**
- Standard side-panel size: **303 × 520**
- Window: **1365 × 768**
- Microtube tube width: **19**
- Brace asset: **44 × 465**

### Border radii

Inconsistent; no scale.

- Microtube background: **20**
- App-settings button: **2**
- Frag-view "well" rect: **4**
- Buffer slider bar: **4**
- Slider handle: **4** (literal in `Slider.cpp`)
- Buffer presets segmented control: **5**

### Shadows

There is no shadow-token system; each call site rolls its own faked shadow as an offset solid rect (no blur).

- **Slider handle**: black at α = 0.15, drawn as a rounded-rect 3 pt below the handle (`Slider.cpp:184`).
- **Frag-view well**: a single `#F0F0F0` "shadow" tint offset `(0, 4)` — really just a layered fill.
- **Sample panel**: black at α = 0.25 (focused) / 0.15 (unfocused), drawn as a flat rect offset `(0, 4)` and inflated `−2 px` horizontally.

### Motion / easing

- **No motion tokens. No easings. No transition timings.** Hover and press states are instantaneous color swaps.
- The only animated visuals are simulation-driven: sample-view callout `lerp`s, gel "overcook" shimmer (parameterized in `assets/tuning/gel-render.json`: `NumWaves: 5`, `WavelengthMin: 0.1`, `WavelengthMax: 1`, `Scale: (5, 10)`), and the molecular sim particles. None of these are UI motion.

---

## 5. Component vocabulary

Every UI element is a custom subclass of `View` (`include/View.h`). No native AppKit widgets, no third-party UI kit.

- **ButtonView** (`src/ButtonView.cpp`) — Image-driven (PNG) or text-driven. Default has no border or fill; states are color tints (`gray(.9)` hover, `gray(.7)` press, `(.5,.5,.5,.5)` disabled). Optional rounded-rect fill (`mFillColor`) and stroked frame. Used for the gear, help, "+", and app-settings buttons.
- **CheckboxView** (`src/CheckboxView.cpp`) — 16 × 16 stroked square in `#979797`. When checked, the indicator is a solid square inset by 2 pt (no checkmark glyph). 5 pt gutter to label.
- **Slider** (`src/Slider.cpp`) — Three styles in one class:
  - *Slider*: 1 pt grey track + a `#4990E2` rounded-4 pt **16 × 20** handle with a faux drop-shadow.
  - *Bar*: filled progress bar — `#AEB6C3` fill on `#E8EBF1` track, 4 pt radius. Notches drawn as 2.5 pt circles or vertical hairlines.
  - *Graph*: a column or filled-poly histogram in the same accent blue.
  - Each slider has paired `lo`/`hi` glyph icons at either end (the `slider-icons/*-lo.png`/`*-hi.png` pair).
- **ColorPaletteView** (`src/ColorPaletteView.cpp`) — Grid of 25 × 25 swatches in 4 columns, optional rounded corners. Selected swatch gets a 4 pt solid-black ring inflated outside the cell.
- **BufferView preset segmented control** (`src/BufferView.cpp`) — 3-segment rounded-rect (5 pt) button group with hairline dividers; selected segment fills warm yellow `#FFDC73`. Presets are H₂O / 0.5× TBE / 1× TAE.
- **AppSettingsView popover** (`src/AppSettingsView.cpp`) — Floating popover anchored to the gear button, with light-grey (`#F2F2F2`) rounded-rect (2 pt) buttons stacked vertically, separated by a divider PNG (`app-settings-line.png`).
- **GelView / SampleView / FragmentView / GelSettingsView / SampleSettingsView / BufferView** — Composite "panels" hosting sliders, color palette, headings. **303 × 520** is the standard panel size, with the heading floating above the panel by 25 pt.
- **ImageView** (`src/ImageView.cpp`) — Generic dropped-image holder; uses `Color::gray(.75 / .35)` for chrome.
- **Brace** — Decorative bracket PNG (`brace.png`, 44 × 465) connecting the gel to the side panel. Visual only, no interaction.

---

## 6. Assets

All raster (PNG). **No SVG anywhere** in runtime assets. Each chrome asset has `@1x` and `@2x` variants for HiDPI; there is no `@3x`.

### Logos / branding
*(none found)* — there is no app logo PNG in `assets/`. The only logo source is `design/AppIcon.sketch`.

### Chrome icons (`assets/`)
- `settings.png` — gear glyph (lower-left global button).
- `help.png` — "?" glyph (lower-right global button, opens douglaslab.org/gelbox).
- `new-btn.png` — "+" glyph for adding a new fragment.
- `app-settings-line.png` — divider hairline for the settings popover.
- `microtube1500ul.png` — illustrated Eppendorf microtube; reused as the per-lane sample icon.
- `brace.png` — decorative bracket connecting gel ↔ side panel.

### Slider parameter icons — `assets/slider-icons/` (paired lo/hi glyphs)
- `aspect-lo/hi`, `clock-lo/hi`, `concentration-lo/hi`, `degrade-lo/hi` (with a stray `degrade-hi copy.png`), `gel-lanes-lo/hi`, `gel-rotate-lo/hi`, `multimer-lo/hi`, `size-lo/hi`, `voltage-lo/hi`, `well-damage-lo/hi` — line-art glyphs that bookend each slider.

### Dye / molecular slider icons — `assets/slider-icons/`
3D-rendered molecule images, two styles (spheres and sticks) per dye:
- `dye-bromphenol-blue-3d-{spheres,sticks}`
- `dye-cresol-red-3d-{spheres,sticks}`
- `dye-orange-g-3d-{spheres,sticks}`
- `dye-xylene-cyanol-3d-{spheres,sticks}`

### Buffer-component icons — `assets/molecules/` (8 PNGs)
2D structural-formula-style illustrations used as slider end-caps in `BufferView`:
- `Acetate`, `Borate`, `Bromphenol`, `Cresol`, `EDTA`, `Orange G`, `Tris`, `Xylene`

### Shaders — `assets/shaders/` (visual-effect, not raster)
- `passthrough.vert`, `gel-passthrough.frag`, `warp.frag` (xy-warp distortion), `blur5.frag` / `blur9.frag` / `blur13.frag` (Jam3 separable Gaussian kernels — MIT-licensed). Used to render the gel image with realistic warp and blur.

### Design source files — `design/` (not shipped at runtime)
`AppIcon.sketch`, `Buffer view.sketch`, `dyes.sketch`, `Fragment view.sketch`, `Gel Icons.sketch`, `Gel sim visual features.sketch`, `New app design.sketch`, plus subfolders `flat molecules/`, `Shawn gelbox images/`, `sketches/`, `Snapshots/`, `project planning/`.

---

## 7. Summary

### Vibe

Gelbox is a **light-first, single-mode, single-window desktop app with a deliberately lab-bench aesthetic.** The chrome is cool and slightly clinical: pale blue-greys (`#E8F2F3`, `#F1F1F2`), a muted slate-blue heading color (`#7F94AC`), neutral mid-grey hairlines (`#979797`, `#C4C4C4`), with accents in Cinder's stock blue (`#4990E2`) and a single warm yellow (`#FFDC73`) reserved for the buffer-preset selection. Density is medium-spacious — 303 × 520 panels with generous 16–32 pt gutters — but a lot is packed into a 1365 × 768 frame. Typography is austere: Avenir Medium and Heavy, exactly two sizes (12 / 24), no italic, no mono. The result reads as **educational software / interactive textbook** rather than contemporary SaaS or consumer app. Visual richness comes from the *scientific imagery* — illustrated microtubes, 3D-rendered dye molecules, structural-formula glyphs, and the procedural gel render with shader-driven warp and blur — not from the chrome. The overall feeling is technical-and-illustrated, friendly but unhip; closer in spirit to a Tinkering-Studio exhibit than to a modern design system.

### Gaps a brand designer would still need from us

- **No semantic token tier.** Tokens are C++ struct fields named per-component (`mFragViewWellFill`, `mBufferViewSliderTextLabelColor`). Greys overlap and proliferate (`#777`, `#979797`, `#BDBDBD`, `#C4C4C4`, `#F0F0F0`, `#F1F1F1`, `#F1F1F2`) and should consolidate into a defined neutral ramp.
- **No logo or identity package.** The only logo source is a `.sketch` file; nothing ships.
- **No spacing scale.** Every gutter is a one-off literal; 16, 25, 28, 31, 32, 56 all coexist. Needs a base unit and a defined scale.
- **No radius scale.** 2 / 4 / 5 / 20 are mixed without a system.
- **No shadow language.** Shadows are faked with offset solid rects; there is no blur, no elevation system, no tokens.
- **No motion language.** No easings, no transition timings; hover/press are instantaneous color swaps.
- **No focus-ring system.** Focus is a hard-coded translucent blue rect with magic-number opacity.
- **No dark mode** (and no high-contrast variant).
- **Inconsistent iconography.** Photo-real microtube PNG, illustrated 2D molecules, and 3D-rendered dye renders all coexist. All raster, no SVG, only `@1x` / `@2x`. A single icon system (likely SVG-based with sizing rules) is needed.
- **Two domain palettes** (12-color species, 4-color dyes) with no coordination to the UI palette and no naming, accessibility metadata, or sort order.
- **Type system is thin.** Two weights × two sizes × no defined line-heights or letter-spacing. A heading scale, a body scale, and a tabular-numerals choice for the many numeric readouts are all missing.
- **No CJK / RTL / i18n consideration** anywhere — all strings are hard-coded English.
- **Headline color (`#7F94AC`) and microtube background (`#E8F2F3`) function as the de-facto brand colors** but were never declared as such; the brand designer should explicitly decide whether to adopt, replace, or re-purpose them.
