# M10 — Layout System + Assets + Selection State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the foundation pieces every subsequent Phase 2 milestone depends on: a TypeScript port of `Layout.h`, the asset pipeline (PNGs copied from `~/code/gelbox/assets`), a scale-aware asset loader, the Inter webfont applied globally, and `SampleFragRef`-based `selection` / `rollover` state slices added to `GelContext` (mirroring the C++ `SampleFragRefRef` shared-pointer pattern).

**Architecture:** Six independent commits in sequence: (1) `@fontsource/inter` install + global apply, (2) port `Layout.h` field-by-field to `layout.ts`, (3) copy assets (PNGs) to `ts/public/assets/`, (4) `assets.ts` loader with `@2x` auto-pick, (5) add `SampleFragRef` type and `selection`/`rollover` state slices coexisting with existing `selectedLane`/`selectedFragmentIndex` (deprecation deferred), (6) verify dev server + tag.

**Tech Stack:** Existing Phase 1 stack (Vite + React 18 + TS strict + Vitest + Playwright). New runtime dep: `@fontsource/inter`.

---

## File structure

```
ts/
  package.json                             # MODIFY — add @fontsource/inter
  src/
    main.tsx                               # MODIFY — import inter font
    index.css                              # MODIFY — apply Inter family + size-adjust globally
    lib/
      layout/
        layout.ts                          # CREATE — port of Layout.h
        layout.test.ts                     # CREATE — snapshot test of constants
        assets.ts                          # CREATE — @2x-aware Image preloader
        assets.test.ts                     # CREATE — picks @2x at DPR>=2, falls back at DPR=1
      gel/
        sampleFragRef.ts                   # CREATE — type alias + helpers (eq, hash)
        sampleFragRef.test.ts              # CREATE
        gelState.ts                        # MODIFY — add selection, rollover slices + actions
        gelState.test.ts                   # MODIFY (or CREATE if missing) — new tests for SET_SELECTION/SET_ROLLOVER
  public/
    assets/                                # CREATE (copy from /Users/shawn/code/gelbox/assets/)
      slider-icons/                        # all *.png + *@2x.png
      molecules/                           # all *.png + *@2x.png
      brace.png, brace@2x.png
      microtube1500ul.png, microtube1500ul@2x.png
      settings.png, settings@2x.png
      help.png, help@2x.png
      new-btn.png, new-btn@2x.png
      app-settings-line.png, app-settings-line@2x.png
docs/
  superpowers/
    plans/
      2026-05-01-gelbox-ts-m10-layout-assets.md     # this file (mark complete at end)
      2026-05-01-gelbox-ts-phase-2-overview.md      # update sub-plans checkbox at end
```

---

## Task 1: Inter webfont (install, apply, verify)

**Files:**
- Modify: `ts/package.json`
- Modify: `ts/src/main.tsx`
- Modify: `ts/src/index.css`

**Reference:** `Layout.h` lines 120–130 — original Avenir-Medium 12 / Avenir-Heavy 24 / `0x000000` body / `0x7F94AC` head. We replace `Avenir` family with `Inter` everywhere; keep the sizes and colors identical.

- [ ] **Step 1: Install dependency**

```bash
cd /Users/shawn/code/gel/ts
npm install --save @fontsource/inter@^5.1.0
```

Expected output: `added 1 package` or similar; no errors. The package weighs ~1MB unsubsetted; we'll only import the weights we need.

- [ ] **Step 2: Import the two weights we use**

Edit `ts/src/main.tsx`. Add at the top, alongside other imports:

```ts
import '@fontsource/inter/400.css';   // Inter Regular (UI body, slider labels)
import '@fontsource/inter/500.css';   // Inter Medium (replaces Avenir-Medium 12)
import '@fontsource/inter/700.css';   // Inter Bold (replaces Avenir-Heavy 24)
```

Why three weights: `Layout.h` uses `Avenir-Medium` for `mUIFont` (body) and `mSubheadFont`, and `Avenir-Heavy` for `mHeadFont`. Inter has the same hierarchy at 400/500/700.

- [ ] **Step 3: Apply Inter globally + size-adjust to compensate metric drift**

Edit `ts/src/index.css`. Locate the existing `:root` or top-level rules and add (or extend) a body rule:

```css
:root {
  /* Inter ships with x-height ~0.523em; Avenir ~0.493em. Reduce font-size-adjust to slim Inter to match. */
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size-adjust: 0.493;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: inherit;
}
```

If `index.css` already declares `font-family` in `:root`, replace the value rather than duplicating the rule.

- [ ] **Step 4: Run dev server and visually confirm Inter loads**

```bash
lsof -ti:5173 | xargs kill -9 2>/dev/null
cd /Users/shawn/code/gel/ts && npm run dev
```

Open http://localhost:5173/ — DevTools → Network → Font, confirm `inter-latin-400-normal.woff2`, `500-normal.woff2`, `700-normal.woff2` load successfully (200). DevTools → Computed style on body → `font-family` should resolve to `Inter`.

- [ ] **Step 5: Run unit tests; verify nothing broke**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

Expected: 146/146 passing (the existing Phase 1 count).

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add package.json package-lock.json src/main.tsx src/index.css
git commit -m "feat(font): install Inter via @fontsource and apply globally with size-adjust"
```

---

## Task 2: Port `Layout.h` → `layout.ts`

**Files:**
- Create: `ts/src/lib/layout/layout.ts`
- Create: `ts/src/lib/layout/layout.test.ts`

**Reference:** `/Users/shawn/code/gelbox/include/Layout.h` (full file is 200 lines; port every field). Preserve C++ field names exactly (just drop the leading `m`) so future cross-reference is grep-friendly.

- [ ] **Step 1: Write the failing snapshot test**

Create `ts/src/lib/layout/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { LAYOUT } from './layout';

describe('LAYOUT', () => {
  it('matches Layout.h pixel positions for the gel', () => {
    expect(LAYOUT.gelSize).toEqual({ x: 390, y: 520 });
    expect(LAYOUT.gelTopLeft).toEqual({ x: 208, y: 124 });
    expect(LAYOUT.gelDefaultLanes).toBe(7);
  });

  it('matches Layout.h pixel positions for sample and inspector', () => {
    expect(LAYOUT.sampleSize).toEqual({ x: 362, y: 520 });
    expect(LAYOUT.gelToSampleGutter).toBe(30);
    expect(LAYOUT.sampleToBraceGutter).toBe(31);
    expect(LAYOUT.braceSize).toEqual({ x: 44, y: 465 });
    expect(LAYOUT.gelSettingsSize).toEqual({ x: 303, y: 520 });
    expect(LAYOUT.sampleSettingsSize).toEqual({ x: 303, y: 520 });
    expect(LAYOUT.fragViewSize).toEqual({ x: 303, y: 520 });
  });

  it('matches Layout.h color hex codes', () => {
    // Avenir → Inter, but colors stay
    expect(LAYOUT.gelMicrotubeBkgndColor).toBe('#E8F2F3');
    expect(LAYOUT.gelMicrotubeBkgndColorSelected).toBe('#A1D6FF');
    expect(LAYOUT.headFontColor).toBe('#7F94AC');
    expect(LAYOUT.uiFontColor).toBe('#777777');
    expect(LAYOUT.subheadFontColor).toBe('#000000');
    expect(LAYOUT.sliderHandleColor).toBe('#4990E2');
    expect(LAYOUT.sliderLineColor).toBe('#979797');
    expect(LAYOUT.ruleColor).toBe('#C4C4C4');
  });

  it('matches Layout.h font sizes', () => {
    expect(LAYOUT.headFontSize).toBe(24);
    expect(LAYOUT.subheadFontSize).toBe(12);
    expect(LAYOUT.uiFontSize).toBe(12);
  });

  it('matches Layout.h slider geometry', () => {
    expect(LAYOUT.sliderHandleSize).toEqual({ x: 16, y: 20 });
    expect(LAYOUT.sliderNotchRadius).toBe(2.5);
    expect(LAYOUT.btnSize).toEqual({ x: 32, y: 32 });
    expect(LAYOUT.btnGutter).toBe(16);
    expect(LAYOUT.headingGutter).toBe(25);
  });

  it('matches Layout.h window size', () => {
    expect(LAYOUT.windowSize).toEqual({ x: 1365, y: 768 });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run src/lib/layout/layout.test.ts
```

Expected: `FAIL` with "Cannot find module './layout'" or similar.

- [ ] **Step 3: Write `layout.ts` with full port of Layout.h**

Create `ts/src/lib/layout/layout.ts`. Include EVERY field from `Layout.h`. Use TypeScript types `Vec2 = { x: number; y: number }` and `Hex = `${'#'}${string}`` for colors. The font family migrates `Avenir-Medium` → `'Inter'`, `Avenir-Heavy` → `'Inter'` (the weight is what differs):

```ts
export interface Vec2 { x: number; y: number }

export const LAYOUT = {
  // main view
  windowSize:        { x: 1365, y: 768 } as Vec2,

  // gel
  gelSize:           { x: 390, y: 520 } as Vec2,
  gelTopLeft:        { x: 208, y: 124 } as Vec2,
  gelTopLeftMin:     { x: 8,   y: 64  } as Vec2,
  gelDefaultLanes:   7,
  gelWellGutter:     20,
  gelMicrotubeBkgndCornerRadius:        20,
  gelMicrotubeBkgndTopInsetFromIcon:    16,
  gelMicrotubeBkgndColor:               '#E8F2F3',
  gelMicrotubeBkgndColorSelected:       '#A1D6FF',
  gelMicrotubeIconToGelGutter:          6,
  gelMicrotubeWellPadding:              4,
  gelMicrotubeIconPadding:              10,

  loupeSize:         { x: 171, y: 171 } as Vec2,
  sampleSize:        { x: 362, y: 520 } as Vec2,

  gelToSampleGutter:   30,
  gelToBraceGutter:    30,
  sampleToBraceGutter: 31,

  ruleColor:           '#C4C4C4',
  headingGutter:       25,

  // app settings
  appSettingsToFirstWidgetGutter: 32,
  appSettingsToDivLine:           { x: 4, y: 10 } as Vec2,
  appSettingsItemVOffset:         28,

  checkboxSize:           { x: 16, y: 16 } as Vec2,
  checkboxToLabelGutter:  5,
  checkboxColor:          '#979797',

  appSettingsButtonColor:        'rgba(204,204,204,1)',  // ColorA(.8,.8,.8,1)
  appSettingsButtonCornerRadius: 2,

  // gel settings view
  gelSettingsSize:               { x: 303, y: 520 } as Vec2,
  gelSettingsSlidersTopLeft:     { x: 84,  y: 246 } as Vec2,
  gelSettingsRuleTopLeft:        { x: 66,  y: 216.5 } as Vec2,
  gelSettingsRuleLength:         237,
  gelSettingsHeaderBaselinePos:  { x: 76,  y: -25 } as Vec2,  // -mHeadingGutter
  gelSettingsHeaderStr:          'Gel',
  gelViewBufferViewTopLeft:      { x: 61,  y: 15 } as Vec2,
  gelSettingsBtnRightOfGel:      false,

  // sample settings view
  sampleSettingsContentOffset:   { x: 8, y: 0 } as Vec2,
  sampleSettingsSize:            { x: 303, y: 520 } as Vec2,
  sampleSettingsSlidersTopLeft:  { x: 131 + 8, y: 336 } as Vec2,
  sampleSettingsRuleTopLeft:     { x: 59 + 8,  y: 269.5 } as Vec2,
  sampleSettingsRuleLength:      237,
  sampleBufferViewTopLeft:       { x: 65 + 8,  y: 65 } as Vec2,
  sampleSettingsSlidersToDyeLabel: 16,
  sampleSettingsSliderVOffset:    31,
  sampleSettingsHeaderBaselinePos: { x: 84 + 8, y: -25 } as Vec2,
  sampleSettingsHeaderStr:        'Buffer + Dyes',

  // sample view
  molecularSimBkgndColor:         '#F1F1F2',
  sampleViewMicrotubeBkgndGutter: 11,
  sampleViewMicrotubeBkgndRadius: 20,
  sampleViewMicrotubeWidth:       19,
  sampleViewMicrotubeGutter:      25,  // mHeadingGutter
  sampleViewHeaderBaselinePos:    { x: 51, y: -25 } as Vec2,
  sampleViewHeaderStr:            'Sample',
  sampleViewFragSelectColor:      '#000000',
  sampleViewFragHoverColor:       '#FFFF00',
  sampleViewFragOutlineWidth:     4,

  // buffer view
  bufferViewSize:                 { x: 303, y: 180 } as Vec2,
  bufferViewSlidersTopLeft:       { x: 66, y: 41 } as Vec2,
  bufferViewSliderVOffset:        31,
  bufferViewSliderBarSize:        { x: 135, y: 23 } as Vec2,
  bufferViewSlidersIconGutter:    13,
  bufferViewSliderEmptyColor:     '#E8EBF1',
  bufferViewSliderFillColor:      '#AEB6C3',
  bufferViewSliderTextLabelColor: '#777777',
  bufferViewSliderTextValueColor: '#333333',  // gray(.2)
  bufferViewSliderCornerRadius:   4,
  bufferViewSliderLabelFont:      'Inter',
  bufferViewSliderLabelFontSize:  12,
  bufferViewPresetsTopLeft:       { x: 66, y: 0 } as Vec2,
  bufferViewPresetsSize:          { x: 135, y: 23 } as Vec2,
  bufferViewPresetsCornerRadius:  5,
  bufferViewPresetsColor:         '#979797',
  bufferViewPresetsFont:          'Inter',
  bufferViewPresetsFontSize:      12,
  bufferViewPresetsFontColor:     '#2B2B2B',
  bufferViewPresetsSelectColor:   '#FFDC73',

  // shared text styles (Avenir → Inter; Heavy → 700, Medium → 500)
  subheadFont:        'Inter',
  subheadFontWeight:  500,
  subheadFontSize:    12,
  subheadFontColor:   '#000000',

  headFont:           'Inter',
  headFontWeight:     700,
  headFontSize:       24,
  headFontColor:      '#7F94AC',

  uiFont:             'Inter',
  uiFontWeight:       500,
  uiFontSize:         12,
  uiFontColor:        '#777777',

  // fragment view
  fragViewSize:                  { x: 303, y: 520 } as Vec2,
  fragViewSlidersTopLeft:        { x: 63, y: 190 } as Vec2,
  fragViewSlidersWidth:          217,
  fragViewSlidersIconGutter:     16,
  fragViewSlidersGraphHeight:    32,
  fragViewSlidersVOffset:        56,
  fragViewSliderIconNotionalSize: { x: 26, y: 26 } as Vec2,
  fragViewColorsTopLeft:         { x: 173, y: 74 } as Vec2,
  fragViewColorSize:             { x: 25, y: 25 } as Vec2,
  fragViewColorsNumCols:         4,
  fragViewHeaderBaselinePos:     { x: 77, y: -25 } as Vec2,
  fragViewHeaderStr:             'Species',
  fragViewWellTopLeft:           { x: 77, y: 71 } as Vec2,
  fragViewWellSize:              { x: 80, y: 80 } as Vec2,
  fragViewWellCornerRadius:      4,
  fragViewWellStroke:            '#BDBDBD',
  fragViewWellFill:              '#F1F1F1',
  fragViewWellShadow:            '#F0F0F0',
  fragViewWellShadowOffset:      { x: 0, y: 4 } as Vec2,

  // buttons
  btnSize:        { x: 32, y: 32 } as Vec2,
  btnHoverColor:  '#E5E5E5',  // gray(.9)
  btnDownColor:   '#B3B3B3',  // gray(.7)
  btnGutter:      16,

  // sliders
  sliderLineColor:    '#979797',
  sliderHandleColor:  '#4990E2',
  sliderHandleSize:   { x: 16, y: 20 } as Vec2,
  sliderNotchRadius:  2.5,

  // misc
  braceSize:      { x: 44, y: 465 } as Vec2,

  // debug
  debugDrawLayoutGuides:     false,
  debugDrawLayoutGuideColor: '#18BFFF',
} as const;

export type Layout = typeof LAYOUT;
```

- [ ] **Step 4: Run test, verify it passes**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run src/lib/layout/layout.test.ts
```

Expected: PASS, all 6 expectations.

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/lib/layout/layout.ts src/lib/layout/layout.test.ts
git commit -m "feat(layout): port Layout.h to layout.ts (pixel positions, colors, fonts)"
```

---

## Task 3: Copy assets

**Files:**
- Copy: `/Users/shawn/code/gelbox/assets/{slider-icons,molecules,brace*.png,microtube*.png,settings*.png,help*.png,new-btn*.png,app-settings-line*.png}` → `ts/public/assets/`

The `palette/` XMLs are not Phase 2 (legacy ladder fixtures); skip those.

- [ ] **Step 1: Create destination directory and copy directories**

```bash
cd /Users/shawn/code/gel/ts
mkdir -p public/assets
cp -r /Users/shawn/code/gelbox/assets/slider-icons public/assets/
cp -r /Users/shawn/code/gelbox/assets/molecules public/assets/
```

- [ ] **Step 2: Copy individual loose PNGs**

```bash
cd /Users/shawn/code/gel/ts
cp /Users/shawn/code/gelbox/assets/brace.png             public/assets/
cp /Users/shawn/code/gelbox/assets/brace@2x.png          public/assets/
cp /Users/shawn/code/gelbox/assets/microtube1500ul.png   public/assets/
cp /Users/shawn/code/gelbox/assets/microtube1500ul@2x.png public/assets/
cp /Users/shawn/code/gelbox/assets/settings.png          public/assets/
cp /Users/shawn/code/gelbox/assets/settings@2x.png       public/assets/
cp /Users/shawn/code/gelbox/assets/help.png              public/assets/
cp /Users/shawn/code/gelbox/assets/help@2x.png           public/assets/
cp /Users/shawn/code/gelbox/assets/new-btn.png           public/assets/
cp /Users/shawn/code/gelbox/assets/new-btn@2x.png        public/assets/
cp /Users/shawn/code/gelbox/assets/app-settings-line.png public/assets/
cp /Users/shawn/code/gelbox/assets/app-settings-line@2x.png public/assets/
```

- [ ] **Step 3: Verify copy**

```bash
cd /Users/shawn/code/gel/ts
ls public/assets/                          # 12 loose pngs + 2 dirs
ls public/assets/slider-icons/ | wc -l     # 60 files (30 icons × 2 scales) — verify
ls public/assets/molecules/    | wc -l     # 16 files (8 dyes × 2 scales)
```

Expected: `slider-icons` dir has ~60 files, `molecules` dir has ~16 files.

- [ ] **Step 4: Verify served by Vite dev server**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/assets/brace.png
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/assets/slider-icons/voltage-lo.png
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/assets/molecules/Tris.png
```

If dev server isn't running, start it: `lsof -ti:5173 | xargs kill -9 2>/dev/null; (cd /Users/shawn/code/gel/ts && npm run dev) &` then retry. Expected: `200 200 200`.

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add public/assets
git commit -m "assets: copy gelbox PNG assets (slider-icons, molecules, brace, microtube, settings)"
```

The repo already commits binary PNGs (Phase 1 didn't have any but this is a one-time bulk copy; ~1MB total). If the user has a `.gitattributes` LFS rule, this commit will respect it; check `git status` for any LFS conversion messages — none expected since `~/code/gelbox` ships them as plain PNGs.

---

## Task 4: `assets.ts` — `@2x`-aware preloader

**Files:**
- Create: `ts/src/lib/layout/assets.ts`
- Create: `ts/src/lib/layout/assets.test.ts`

**Reference:** `Layout::uiImageWithPath` (`/Users/shawn/code/gelbox/src/Layout.cpp` lines 28–76) — at scale factor `-1`, the C++ tries `@2x` if window content scale is 2, falls back to `1x` if `@2x` doesn't exist, otherwise uses `1x`.

- [ ] **Step 1: Write the failing tests**

Create `ts/src/lib/layout/assets.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAssetUrl } from './assets';

describe('resolveAssetUrl', () => {
  const origDPR = window.devicePixelRatio;
  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: origDPR });
  });

  it('returns @2x url at DPR >= 2', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    expect(resolveAssetUrl('/assets/slider-icons/voltage-lo.png')).toBe(
      '/assets/slider-icons/voltage-lo@2x.png'
    );
  });

  it('returns 1x url at DPR < 2', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 });
    expect(resolveAssetUrl('/assets/slider-icons/voltage-lo.png')).toBe(
      '/assets/slider-icons/voltage-lo.png'
    );
  });

  it('preserves nested directories', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    expect(resolveAssetUrl('/assets/molecules/Tris.png')).toBe(
      '/assets/molecules/Tris@2x.png'
    );
  });

  it('returns input unchanged for non-png paths', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 2 });
    expect(resolveAssetUrl('/assets/foo.svg')).toBe('/assets/foo.svg');
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run src/lib/layout/assets.test.ts
```

Expected: FAIL ("Cannot find module './assets'").

- [ ] **Step 3: Write `assets.ts`**

Create `ts/src/lib/layout/assets.ts`:

```ts
/**
 * Resolve an asset URL to its DPR-appropriate variant.
 * Mirrors Layout::uiImageWithPath: at devicePixelRatio >= 2, swap `foo.png` → `foo@2x.png`.
 * Falls through unchanged for non-`.png` paths or when DPR < 2.
 *
 * Note: this does NOT verify the @2x file exists on disk — the build step ensures it.
 * If a caller needs a graceful fallback (load @2x; fall back to 1x on 404), use `loadImage` below.
 */
export function resolveAssetUrl(url: string): string {
  if (!url.endsWith('.png')) return url;
  if (typeof window === 'undefined' || window.devicePixelRatio < 2) return url;
  return url.replace(/\.png$/, '@2x.png');
}

/**
 * Preload an image and resolve to an HTMLImageElement once decoded.
 * Tries `@2x` at DPR>=2; falls back to `1x` if `@2x` 404s.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  const candidate = resolveAssetUrl(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => {
      if (candidate !== url) {
        // fall back to 1x
        const fallback = new Image();
        fallback.onload  = () => resolve(fallback);
        fallback.onerror = () => reject(new Error(`Failed to load ${url} (and ${candidate})`));
        fallback.src = url;
      } else {
        reject(new Error(`Failed to load ${url}`));
      }
    };
    img.src = candidate;
  });
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run src/lib/layout/assets.test.ts
```

Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/lib/layout/assets.ts src/lib/layout/assets.test.ts
git commit -m "feat(assets): scale-aware url resolver + image preloader (mirrors uiImageWithPath)"
```

---

## Task 5: `SampleFragRef` type + `selection` / `rollover` state slices

**Files:**
- Create: `ts/src/lib/gel/sampleFragRef.ts`
- Create: `ts/src/lib/gel/sampleFragRef.test.ts`
- Modify: `ts/src/lib/gel/gelState.ts`

**Reference:** C++ `SampleFragRefRef` (`/Users/shawn/code/gelbox/include/Sample.h`-ish; declared in `Sample.h` per usage in `GelView.h:124`). The C++ struct is a `(SampleRef, int frag)` pair where `frag = -1` means "sample selected, no specific fragment". In our port, since samples are addressed by lane index in the reducer, this becomes `{ lane: number; fragmentIndex: number | null }`. Coexists with existing `state.selectedLane` / `state.selectedFragmentIndex` until M13 migrates consumers.

- [ ] **Step 1: Write failing tests for `SampleFragRef`**

Create `ts/src/lib/gel/sampleFragRef.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sampleFragRefEq, type SampleFragRef } from './sampleFragRef';

describe('sampleFragRefEq', () => {
  it('returns true for two nulls', () => {
    expect(sampleFragRefEq(null, null)).toBe(true);
  });

  it('returns false when one is null', () => {
    expect(sampleFragRefEq({ lane: 0, fragmentIndex: 0 }, null)).toBe(false);
    expect(sampleFragRefEq(null, { lane: 0, fragmentIndex: 0 })).toBe(false);
  });

  it('returns true for matching lane + fragmentIndex', () => {
    const a: SampleFragRef = { lane: 2, fragmentIndex: 5 };
    const b: SampleFragRef = { lane: 2, fragmentIndex: 5 };
    expect(sampleFragRefEq(a, b)).toBe(true);
  });

  it('returns true when both fragmentIndex are null and lanes match (sample-only ref)', () => {
    const a: SampleFragRef = { lane: 3, fragmentIndex: null };
    const b: SampleFragRef = { lane: 3, fragmentIndex: null };
    expect(sampleFragRefEq(a, b)).toBe(true);
  });

  it('returns false when lanes differ', () => {
    expect(sampleFragRefEq(
      { lane: 1, fragmentIndex: 0 },
      { lane: 2, fragmentIndex: 0 },
    )).toBe(false);
  });

  it('returns false when fragmentIndex differ', () => {
    expect(sampleFragRefEq(
      { lane: 1, fragmentIndex: 0 },
      { lane: 1, fragmentIndex: 1 },
    )).toBe(false);
    expect(sampleFragRefEq(
      { lane: 1, fragmentIndex: null },
      { lane: 1, fragmentIndex: 0 },
    )).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests; verify they fail**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run src/lib/gel/sampleFragRef.test.ts
```

Expected: FAIL ("Cannot find module './sampleFragRef'").

- [ ] **Step 3: Write `sampleFragRef.ts`**

Create `ts/src/lib/gel/sampleFragRef.ts`:

```ts
/**
 * Reference to a sample (by lane index) and optionally a specific fragment within it.
 * Mirrors the C++ `SampleFragRef` (which paired a SampleRef with a fragment index, where -1 means "sample only").
 *
 * `fragmentIndex === null` means "the sample as a whole is referenced; no specific fragment".
 */
export interface SampleFragRef {
  lane:          number;
  fragmentIndex: number | null;
}

export function sampleFragRefEq(
  a: SampleFragRef | null,
  b: SampleFragRef | null,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.lane === b.lane && a.fragmentIndex === b.fragmentIndex;
}
```

- [ ] **Step 4: Run tests; verify they pass**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run src/lib/gel/sampleFragRef.test.ts
```

Expected: PASS, all 6 tests.

- [ ] **Step 5: Add reducer state slices + actions**

Edit `ts/src/lib/gel/gelState.ts`. Make these specific changes:

1. Add import at the top:
```ts
import type { SampleFragRef } from './sampleFragRef';
import { sampleFragRefEq } from './sampleFragRef';
```

2. In the `GelState` interface, append two new fields after `loupeNextId`:
```ts
  selection:             SampleFragRef | null;  // mirrors C++ mSelectedState
  rollover:              SampleFragRef | null;  // mirrors C++ mRolloverState
```

3. In the `Action` union, append two new cases before the closing `;`:
```ts
  | { type: 'SET_SELECTION'; ref: SampleFragRef | null }
  | { type: 'SET_ROLLOVER';  ref: SampleFragRef | null }
```

4. In `initialGelState()`, add to the returned object before the closing brace (after `loupeNextId: 1,`):
```ts
    selection: null,
    rollover:  null,
```

5. In `gelReducer`, add two new cases before the `default:` block:
```ts
    case 'SET_SELECTION':
      if (sampleFragRefEq(state.selection, action.ref)) return state;
      return { ...state, selection: action.ref };
    case 'SET_ROLLOVER':
      if (sampleFragRefEq(state.rollover, action.ref)) return state;
      return { ...state, rollover: action.ref };
```

The eq-check guard short-circuits identity-preserving updates, which prevents needless re-renders downstream.

- [ ] **Step 6: Write reducer tests**

Look for an existing `gelState.test.ts`. If it exists, append; if not, create one. Run `ls /Users/shawn/code/gel/ts/src/lib/gel/gelState.test.ts` first; if it doesn't exist, create with the boilerplate below.

Create or extend `ts/src/lib/gel/gelState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { gelReducer, initialGelState } from './gelState';

describe('gelReducer SET_SELECTION', () => {
  it('updates selection to a new ref', () => {
    const s0 = initialGelState();
    expect(s0.selection).toBeNull();
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref: { lane: 2, fragmentIndex: 3 } });
    expect(s1.selection).toEqual({ lane: 2, fragmentIndex: 3 });
  });

  it('preserves state identity when selection is unchanged', () => {
    const s0 = initialGelState();
    const ref = { lane: 1, fragmentIndex: null };
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref });
    const s2 = gelReducer(s1, { type: 'SET_SELECTION', ref: { lane: 1, fragmentIndex: null } });
    expect(s2).toBe(s1);  // strict ===, no new object created
  });

  it('clears selection to null', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref: { lane: 0, fragmentIndex: 0 } });
    const s2 = gelReducer(s1, { type: 'SET_SELECTION', ref: null });
    expect(s2.selection).toBeNull();
  });
});

describe('gelReducer SET_ROLLOVER', () => {
  it('updates rollover to a new ref', () => {
    const s0 = initialGelState();
    expect(s0.rollover).toBeNull();
    const s1 = gelReducer(s0, { type: 'SET_ROLLOVER', ref: { lane: 4, fragmentIndex: 0 } });
    expect(s1.rollover).toEqual({ lane: 4, fragmentIndex: 0 });
  });

  it('preserves state identity when rollover is unchanged', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_ROLLOVER', ref: { lane: 0, fragmentIndex: 0 } });
    const s2 = gelReducer(s1, { type: 'SET_ROLLOVER', ref: { lane: 0, fragmentIndex: 0 } });
    expect(s2).toBe(s1);
  });

  it('selection and rollover are independent', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_SELECTION', ref: { lane: 1, fragmentIndex: 0 } });
    const s2 = gelReducer(s1, { type: 'SET_ROLLOVER',  ref: { lane: 2, fragmentIndex: 5 } });
    expect(s2.selection).toEqual({ lane: 1, fragmentIndex: 0 });
    expect(s2.rollover).toEqual({ lane: 2, fragmentIndex: 5 });
  });
});
```

- [ ] **Step 7: Run all unit tests; verify everything passes**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

Expected: all green; previous Phase 1 count (146) plus new tests for layout (6), assets (4), sampleFragRef (6), and gelState selection/rollover (6) = **168** passing.

- [ ] **Step 8: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/lib/gel/sampleFragRef.ts src/lib/gel/sampleFragRef.test.ts src/lib/gel/gelState.ts src/lib/gel/gelState.test.ts
git commit -m "feat(state): add SampleFragRef + selection/rollover slices to gelState"
```

---

## Task 6: Verify dev server + Playwright unchanged + tag

- [ ] **Step 1: Restart dev server**

```bash
lsof -ti:5173 | xargs kill -9 2>/dev/null
cd /Users/shawn/code/gel/ts && npm run dev > /tmp/m10-vite.log 2>&1 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```

Expected: `200`. Check `/tmp/m10-vite.log` for any errors.

- [ ] **Step 2: Visit app in browser, sanity check**

Open http://localhost:5173/#/gel — confirm the existing Phase 1 UI still works (load fixture, drag bands, save/load) AND that text is now rendered in Inter (DevTools → body → computed font-family).

- [ ] **Step 3: Run full Playwright suite**

```bash
cd /Users/shawn/code/gel/ts && npm run test:e2e -- --reporter=line
```

Expected: 22/22 passing per backend on macOS (the existing Phase 1 baseline). Font change shouldn't affect the gel canvas goldens since those don't render text. If a Playwright golden fails due to UI text rendering in a different font, update the golden — that's an expected cosmetic change, not a regression.

- [ ] **Step 4: Mark M10 done in plan files**

Update `/Users/shawn/code/gel/docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md`:
- Change `- [ ] **M10 Layout system + assets + selection state** — \`2026-05-01-gelbox-ts-m10-layout-assets.md\` — next-execute` to `- [x] **M10 Layout system + assets + selection state** — \`2026-05-01-gelbox-ts-m10-layout-assets.md\``
- Change `- [ ] **M11 Stage shell** — to be detail-planned before M11 starts` to `- [ ] **M11 Stage shell** — to be detail-planned before M11 starts — next-execute`

- [ ] **Step 5: Commit plan update + tag**

```bash
cd /Users/shawn/code/gel
git add docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md docs/superpowers/plans/2026-05-01-gelbox-ts-m10-layout-assets.md
git commit -m "docs(plan): mark M10 layout + assets + selection state complete"
git tag m10-layout-assets
git push && git push --tags
```

---

## Notes for the implementer

**Why coexist instead of migrate:** `state.selectedLane` and `state.selectedFragmentIndex` already exist and are read in many places (`GelOverlay.tsx`, `MicrotubeRow.tsx`, etc.). Migrating every consumer in M10 would balloon the milestone. Instead, add the new `selection` slice alongside; M13 (`GelView` rebuild) will switch consumers over. Treat them as a single conceptual field with two representations during the transition; whenever you write one, write the other so they stay in sync. Actually — **don't** auto-sync; the existing reducer cases that update `selectedLane`/`selectedFragmentIndex` keep doing so without touching `selection`. M13 will replace those cases with `SET_SELECTION` actions and remove the legacy fields. This avoids a half-migration where both fields are partially right.

**Why `fragmentIndex: number | null` instead of `-1`:** Idiomatic TS. The C++ used `-1` because C++ struct fields can't be null without `optional<int>`; TS has first-class null. Future bug-bait at the boundary — but the boundary is ours alone, no C++ interop here.

**Why no `assets.ts` retina fallback test:** The test would require mocking `Image` or running in a browser harness. The file-existence guarantee comes from the asset pipeline (Task 3 copied both `1x` and `@2x` files). If a future @2x file is missing, the runtime fallback will trigger. The unit test just verifies URL rewriting logic.

**Inter `font-size-adjust` value 0.493:** This is approximately Avenir's x-height ratio. Empirical — verify in M11 when actual headings render and adjust if drift exceeds 2px.
