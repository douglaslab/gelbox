# M14 — FragmentView (Species — Default Inspector) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the **Species panel** (`FragmentView` in C++) and make it the **default inspector content**. The right-side panel currently shows a placeholder labeled "Gel" with our old Phase 1 GelControls — that's wrong. The C++ default is `FragmentView` with header "Species", a 12-color palette, an 80×80 well preview, and 5 sliders (size, concentration, aspect, aggregate-graph, degrade). Auto-select the first fragment when a sample is loaded so the panel always has content.

**Architecture:** Five new reducer actions wire the slider primitives (M12) to fragment fields. A 12-color palette constant + `ColorPaletteView` component (4-col × 3-row swatch grid) lets users change fragment color. A small `FragmentWell` component shows an 80×80 rounded preview filled with the fragment color. `FragmentView` composes everything inside a Layout-positioned panel. `InspectorPanel` replaces `InspectorPlaceholder`, routing to `FragmentView` (when a fragment is selected) → `SampleSettingsView` (M16, stub for now) → `GelSettingsView` (M17, stub for now). A reducer change auto-selects fragment 0 when a sample is loaded with no explicit selection.

**Tech Stack:** Same as Phase 2. Uses `SliderView` from M12, `LAYOUT` from M10.

---

## File structure

```
ts/
  src/
    lib/
      gel/
        gelState.ts                     # MODIFY — 5 fragment-edit actions; auto-select frag 0 on LOAD_FIXTURE
      fragment/
        palette.ts                      # CREATE — 12-color palette constants
    components/
      inspector/
        FragmentView.tsx                # CREATE — Species panel
        FragmentView.module.css         # CREATE
        ColorPaletteView.tsx            # CREATE — 4-col swatch grid
        ColorPaletteView.module.css     # CREATE
        FragmentWell.tsx                # CREATE — 80×80 colored well preview
        InspectorPanel.tsx              # CREATE — routes content by inspectorMode/selection
      stage/
        InspectorPlaceholder.tsx        # DELETE — replaced by InspectorPanel
    routes/
      GelPage.tsx                       # MODIFY — use InspectorPanel
  tests/
    unit/
      gelState.test.ts                  # MODIFY — append fragment-edit + auto-select tests
      palette.test.ts                   # CREATE — palette constant sanity
    visual/
      fragment-view.spec.ts             # CREATE — Species panel mount + slider edits + color pick
docs/
  superpowers/
    plans/
      2026-05-01-gelbox-ts-m14-fragment-view.md   # this file
      2026-05-01-gelbox-ts-phase-2-overview.md    # update at end
```

---

## Task 1: Reducer fragment-edit actions + auto-select

**Files:**
- Modify: `ts/src/lib/gel/gelState.ts`
- Modify: `ts/tests/unit/gelState.test.ts`

The Fragment type already has `bases`, `mass`, `degrade`, `aspectRatio`, `aggregate`, `color`. Currently only `SET_FRAGMENT_BASES` exists. Add four more setters + a color setter, plus modify `LOAD_FIXTURE` and `LOAD_GEL_STATE` to auto-select fragment 0 when loading a non-empty sample.

- [ ] **Step 1: Add new actions to `Action` union**

In `/Users/shawn/code/gel/ts/src/lib/gel/gelState.ts`, append to the `Action` union:

```ts
  | { type: 'SET_FRAGMENT_MASS';     laneIndex: number; index: number; mass: number }
  | { type: 'SET_FRAGMENT_ASPECT';   laneIndex: number; index: number; aspectRatio: number }
  | { type: 'SET_FRAGMENT_AGGREGATE'; laneIndex: number; index: number; aggregate: number[] }
  | { type: 'SET_FRAGMENT_DEGRADE';  laneIndex: number; index: number; degrade: number }
  | { type: 'SET_FRAGMENT_COLOR';    laneIndex: number; index: number; color: [number, number, number] }
```

- [ ] **Step 2: Add reducer cases**

Find the existing `SET_FRAGMENT_BASES` case in `gelReducer` and add five sibling cases below it that follow the same pattern (pure update of one fragment field):

```ts
    case 'SET_FRAGMENT_MASS': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, mass: action.mass } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_ASPECT': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, aspectRatio: action.aspectRatio } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_AGGREGATE': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, aggregate: action.aggregate.slice() } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_DEGRADE': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, degrade: action.degrade } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_COLOR': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, color: action.color } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
```

- [ ] **Step 3: Auto-select fragment 0 on LOAD_FIXTURE**

Currently `LOAD_FIXTURE` sets `selectedFragmentIndex: null`. Change it to select fragment 0 if the sample has fragments:

Find:
```ts
    case 'LOAD_FIXTURE': {
      const samples = state.samples.slice();
      samples[action.lane] = action.sample;
      return {
        ...state,
        samples,
        fixtureKey: action.key,
        selectedLane: action.lane,
        selectedFragmentIndex: null,
        ctx: { ...state.ctx, sampleBuffer: action.sample.buffer },
        drag: null,
      };
    }
```

Replace `selectedFragmentIndex: null,` with:
```ts
        selectedFragmentIndex: action.sample.fragments.length > 0 ? 0 : null,
```

- [ ] **Step 4: Auto-select on initial state too**

In `initialGelState()`, the first sample loads from the ladder fixture into lane 0. Currently `selectedFragmentIndex: null`. Change it to:
```ts
    selectedFragmentIndex: sample.fragments.length > 0 ? 0 : null,
```

This way the app boots with fragment 0 selected and the FragmentView shows immediately.

- [ ] **Step 5: Append tests**

Append to `/Users/shawn/code/gel/ts/tests/unit/gelState.test.ts`:

```ts
describe('gelReducer fragment-edit actions', () => {
  function loaded() {
    // initialGelState() loads ladder sample into lane 0 with fragment 0 selected
    return initialGelState();
  }

  it('SET_FRAGMENT_MASS updates the fragment mass', () => {
    const s0 = loaded();
    const s1 = gelReducer(s0, { type: 'SET_FRAGMENT_MASS', laneIndex: 0, index: 0, mass: 42 });
    expect(s1.samples[0]!.fragments[0].mass).toBe(42);
  });

  it('SET_FRAGMENT_ASPECT updates the aspect ratio', () => {
    const s0 = loaded();
    const s1 = gelReducer(s0, { type: 'SET_FRAGMENT_ASPECT', laneIndex: 0, index: 0, aspectRatio: 8 });
    expect(s1.samples[0]!.fragments[0].aspectRatio).toBe(8);
  });

  it('SET_FRAGMENT_AGGREGATE replaces the aggregate array', () => {
    const s0 = loaded();
    const s1 = gelReducer(s0, { type: 'SET_FRAGMENT_AGGREGATE', laneIndex: 0, index: 0, aggregate: [1, 0.5, 0.25] });
    expect(s1.samples[0]!.fragments[0].aggregate).toEqual([1, 0.5, 0.25]);
  });

  it('SET_FRAGMENT_DEGRADE updates the degrade value', () => {
    const s0 = loaded();
    const s1 = gelReducer(s0, { type: 'SET_FRAGMENT_DEGRADE', laneIndex: 0, index: 0, degrade: 1.5 });
    expect(s1.samples[0]!.fragments[0].degrade).toBe(1.5);
  });

  it('SET_FRAGMENT_COLOR updates the color', () => {
    const s0 = loaded();
    const s1 = gelReducer(s0, { type: 'SET_FRAGMENT_COLOR', laneIndex: 0, index: 0, color: [1, 0.5, 0] });
    expect(s1.samples[0]!.fragments[0].color).toEqual([1, 0.5, 0]);
  });

  it('returns state unchanged when laneIndex has no sample', () => {
    const s0 = loaded();
    const emptyLane = 6;  // last lane has no sample by default
    expect(s0.samples[emptyLane]).toBeNull();
    const s1 = gelReducer(s0, { type: 'SET_FRAGMENT_MASS', laneIndex: emptyLane, index: 0, mass: 42 });
    expect(s1).toBe(s0);
  });
});

describe('initialGelState auto-selects fragment 0', () => {
  it('selects fragment 0 in lane 0 when ladder has fragments', () => {
    const s = initialGelState();
    expect(s.selectedLane).toBe(0);
    expect(s.selectedFragmentIndex).toBe(0);
  });
});
```

- [ ] **Step 6: Run + commit**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
git add src/lib/gel/gelState.ts tests/unit/gelState.test.ts
git commit -m "feat(state): fragment-edit actions (mass/aspect/aggregate/degrade/color) + auto-select frag 0"
```

Expected: 180 + 7 = 187 unit tests passing.

---

## Task 2: Color palette + tests

**Files:**
- Create: `ts/src/lib/fragment/palette.ts`
- Create: `ts/tests/unit/palette.test.ts`

12 hex colors from `FragmentView.cpp:25` arranged 4 cols × 3 rows. The C++ stores them as `Color::hex(0x...)` (sRGB). For our Fragment.color which is linear RGB `[r,g,b]` 0..1, we need to convert. For now, store both the hex strings (for swatch fill) and the linear RGB triples (for setting `Fragment.color`). Use a simple sRGB→linear conversion.

- [ ] **Step 1: Write the failing test**

Create `/Users/shawn/code/gel/ts/tests/unit/palette.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FRAGMENT_PALETTE_HEX, FRAGMENT_PALETTE_LINEAR_RGB, srgbHexToLinearRgb } from '../../src/lib/fragment/palette';

describe('FRAGMENT_PALETTE_HEX', () => {
  it('contains 12 hex colors matching FragmentView.cpp:25', () => {
    expect(FRAGMENT_PALETTE_HEX).toEqual([
      '#0066cc', '#cc0000', '#f74308', '#f7931e',
      '#aaaa00', '#57bb00', '#007200', '#03b6a2',
      '#1700de', '#7300de', '#b8056c', '#333333',
    ]);
  });
});

describe('srgbHexToLinearRgb', () => {
  it('returns [0,0,0] for #000000', () => {
    const rgb = srgbHexToLinearRgb('#000000');
    expect(rgb[0]).toBeCloseTo(0, 6);
    expect(rgb[1]).toBeCloseTo(0, 6);
    expect(rgb[2]).toBeCloseTo(0, 6);
  });

  it('returns [1,1,1] for #FFFFFF', () => {
    const rgb = srgbHexToLinearRgb('#FFFFFF');
    expect(rgb[0]).toBeCloseTo(1, 6);
    expect(rgb[1]).toBeCloseTo(1, 6);
    expect(rgb[2]).toBeCloseTo(1, 6);
  });

  it('approximates linear-RGB for mid-grey #808080 (~0.216)', () => {
    const rgb = srgbHexToLinearRgb('#808080');
    expect(rgb[0]).toBeCloseTo(0.215, 2);
  });
});

describe('FRAGMENT_PALETTE_LINEAR_RGB', () => {
  it('has the same length as the hex palette', () => {
    expect(FRAGMENT_PALETTE_LINEAR_RGB.length).toBe(FRAGMENT_PALETTE_HEX.length);
  });

  it('all triples are 3-tuples in 0..1', () => {
    for (const rgb of FRAGMENT_PALETTE_LINEAR_RGB) {
      expect(rgb).toHaveLength(3);
      for (const c of rgb) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/palette.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write the module**

Create `/Users/shawn/code/gel/ts/src/lib/fragment/palette.ts`:

```ts
/**
 * 12 fragment colors arranged 4 cols × 3 rows.
 * Source: ~/code/gelbox/src/FragmentView.cpp:25 — `getColorPalette()`.
 */
export const FRAGMENT_PALETTE_HEX = [
  '#0066cc', '#cc0000', '#f74308', '#f7931e',
  '#aaaa00', '#57bb00', '#007200', '#03b6a2',
  '#1700de', '#7300de', '#b8056c', '#333333',
] as const;

/**
 * Convert sRGB hex (`#rrggbb`) to linear-RGB [r,g,b] in 0..1.
 * Fragment.color in our sim layer is linear RGB (matches GLSL convention).
 */
export function srgbHexToLinearRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export const FRAGMENT_PALETTE_LINEAR_RGB: readonly [number, number, number][] =
  FRAGMENT_PALETTE_HEX.map(srgbHexToLinearRgb);
```

- [ ] **Step 4: Run + commit**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/palette.test.ts
npm run test:unit
git add src/lib/fragment/palette.ts tests/unit/palette.test.ts
git commit -m "feat(fragment): 12-color palette constants + sRGB->linear-RGB conversion"
```

Expected: 187 + 6 = 193 passing.

---

## Task 3: ColorPaletteView + FragmentWell components

**Files:**
- Create: `ts/src/components/inspector/ColorPaletteView.tsx`
- Create: `ts/src/components/inspector/ColorPaletteView.module.css`
- Create: `ts/src/components/inspector/FragmentWell.tsx`

The palette is 4 columns × 3 rows of 25×25 swatches with 4px corner radius and 2px inset. The well is an 80×80 rounded rectangle filled with the current fragment color.

- [ ] **Step 1: Create ColorPaletteView CSS**

Create `/Users/shawn/code/gel/ts/src/components/inspector/ColorPaletteView.module.css`:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(4, 25px);
  gap: 0;
  user-select: none;
}

.swatch {
  width: 25px;
  height: 25px;
  border: 0;
  padding: 2px;
  background: transparent;
  cursor: pointer;
}

.swatchInner {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.swatch[data-selected="true"] .swatchInner {
  outline: 2px solid #000;
  outline-offset: -2px;
}
```

- [ ] **Step 2: Create ColorPaletteView component**

Create `/Users/shawn/code/gel/ts/src/components/inspector/ColorPaletteView.tsx`:

```tsx
import { FRAGMENT_PALETTE_HEX, FRAGMENT_PALETTE_LINEAR_RGB, srgbHexToLinearRgb } from '../../lib/fragment/palette';
import styles from './ColorPaletteView.module.css';

export interface ColorPaletteViewProps {
  /** Current fragment color (linear RGB 0..1). */
  value: readonly [number, number, number];
  /** Called with new linear-RGB color when a swatch is clicked. */
  onChange: (color: [number, number, number]) => void;
  testId?: string;
}

function rgbApproxEq(a: readonly [number, number, number], b: readonly [number, number, number]) {
  const EPS = 0.001;
  return Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS && Math.abs(a[2] - b[2]) < EPS;
}

/**
 * 4×3 grid of color swatches. Mirrors the C++ ColorPaletteView used inside
 * FragmentView (`/Users/shawn/code/gelbox/src/ColorPaletteView.cpp`).
 *
 * Swatch fill is the sRGB hex (for direct CSS rendering); when clicked we emit
 * the linear-RGB triple to match how Fragment.color is stored downstream.
 */
export function ColorPaletteView({ value, onChange, testId }: ColorPaletteViewProps) {
  return (
    <div className={styles.grid} data-testid={testId}>
      {FRAGMENT_PALETTE_HEX.map((hex, i) => {
        const linear = FRAGMENT_PALETTE_LINEAR_RGB[i];
        const selected = rgbApproxEq(value, linear);
        return (
          <button
            type="button"
            key={hex}
            className={styles.swatch}
            data-selected={selected || undefined}
            data-testid={testId ? `${testId}-swatch-${i}` : undefined}
            onClick={() => onChange(srgbHexToLinearRgb(hex))}
            aria-label={`Color ${i + 1}: ${hex}`}
            aria-pressed={selected}
          >
            <div className={styles.swatchInner} style={{ background: hex }} />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create FragmentWell**

Create `/Users/shawn/code/gel/ts/src/components/inspector/FragmentWell.tsx`:

```tsx
import { LAYOUT } from '../../lib/layout/layout';

export interface FragmentWellProps {
  /** Linear-RGB 0..1; rendered as approximate sRGB by direct CSS conversion. */
  color: readonly [number, number, number];
  testId?: string;
}

function linearToSrgbHex(rgb: readonly [number, number, number]): string {
  const toByte = (c: number) => {
    const srgb = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  };
  const [r, g, b] = rgb.map(toByte);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 80×80 rounded preview swatch showing the current fragment color.
 * Mirrors C++ FragmentView well rendering (FragmentView.cpp:336–353).
 */
export function FragmentWell({ color, testId }: FragmentWellProps) {
  return (
    <div
      data-testid={testId}
      style={{
        width:        LAYOUT.fragViewWellSize.x,
        height:       LAYOUT.fragViewWellSize.y,
        borderRadius: LAYOUT.fragViewWellCornerRadius,
        background:   linearToSrgbHex(color),
        border:       `1px solid ${LAYOUT.fragViewWellStroke}`,
        boxShadow:    `0px ${LAYOUT.fragViewWellShadowOffset.y}px 0 ${LAYOUT.fragViewWellShadow}`,
      }}
    />
  );
}
```

- [ ] **Step 4: Compile + commit**

```bash
cd /Users/shawn/code/gel/ts && npx tsc --noEmit
git add src/components/inspector/
git commit -m "feat(inspector): ColorPaletteView (4x3) + FragmentWell (80x80 rounded preview)"
```

---

## Task 4: FragmentView component

**Files:**
- Create: `ts/src/components/inspector/FragmentView.tsx`
- Create: `ts/src/components/inspector/FragmentView.module.css`

This is the Species panel itself: heading + well preview + color palette + 5 sliders, positioned per Layout. The slider icons come from `/assets/slider-icons/`.

- [ ] **Step 1: Create CSS**

Create `/Users/shawn/code/gel/ts/src/components/inspector/FragmentView.module.css`:

```css
.root {
  position: relative;
  width: 100%;
  height: 100%;
  background: #FFFFFF;
}

.header {
  position: absolute;
  margin: 0;
  line-height: 1;
}

.well {
  position: absolute;
}

.palette {
  position: absolute;
}

.sliders {
  position: absolute;
  display: flex;
  flex-direction: column;
}

.empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
}
```

- [ ] **Step 2: Create FragmentView component**

Create `/Users/shawn/code/gel/ts/src/components/inspector/FragmentView.tsx`:

```tsx
import { useGelDispatch, useGelState } from '../gel/GelContext';
import { LAYOUT } from '../../lib/layout/layout';
import { SliderView } from '../primitives/SliderView';
import { ColorPaletteView } from './ColorPaletteView';
import { FragmentWell } from './FragmentWell';
import styles from './FragmentView.module.css';

const SLIDER_W = LAYOUT.fragViewSlidersWidth;          // 217
const SLIDER_GAP = LAYOUT.fragViewSlidersVOffset;      // 56
const ICON_GUTTER = LAYOUT.fragViewSlidersIconGutter;  // 16
const ICON_SIZE = LAYOUT.fragViewSliderIconNotionalSize; // (26,26)

const SIZE_MIN = 100;
const SIZE_MAX = 14000;
const MASS_MIN = 1;
const MASS_MAX = 175;
const ASPECT_MIN = 1;
const ASPECT_MAX = 16;
const AGG_MAX_MULTIMER = 7;

function fmtBp(v: number): string  { return `${Math.round(v).toLocaleString()} bp`; }
function fmtNg(v: number): string  { return `${Math.round(v).toLocaleString()} ng`; }
function fmtAsp(v: number): string { return `${Math.round(v)} : 1`; }
function fmtDeg(v: number): string { return v.toFixed(2); }

/**
 * "Species" panel — the default inspector content.
 * Renders the currently-selected fragment with editing widgets.
 * Mirrors C++ FragmentView (`/Users/shawn/code/gelbox/src/FragmentView.cpp`).
 */
export function FragmentView() {
  const state    = useGelState();
  const dispatch = useGelDispatch();

  const lane = state.selectedLane;
  const fragIdx = state.selectedFragmentIndex;
  const sample = state.samples[lane];
  const fragment = sample && fragIdx !== null ? sample.fragments[fragIdx] : null;

  const headerStyle = {
    left:        `${LAYOUT.fragViewHeaderBaselinePos.x}px`,
    top:         `${LAYOUT.fragViewHeaderBaselinePos.y}px`,
    font:        `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
    color:       LAYOUT.headFontColor,
  };

  return (
    <div className={styles.root} data-testid="fragment-view">
      <h2 className={styles.header} style={headerStyle}>
        {LAYOUT.fragViewHeaderStr}
      </h2>

      {!fragment && (
        <div className={styles.empty}>
          {sample ? 'No fragment selected' : 'No sample loaded'}
        </div>
      )}

      {fragment && (
        <>
          <div
            className={styles.well}
            style={{
              left: `${LAYOUT.fragViewWellTopLeft.x}px`,
              top:  `${LAYOUT.fragViewWellTopLeft.y}px`,
            }}
          >
            <FragmentWell color={fragment.color} testId="fragment-well" />
          </div>

          <div
            className={styles.palette}
            style={{
              left: `${LAYOUT.fragViewColorsTopLeft.x}px`,
              top:  `${LAYOUT.fragViewColorsTopLeft.y}px`,
            }}
          >
            <ColorPaletteView
              testId="fragment-palette"
              value={fragment.color}
              onChange={(color) =>
                dispatch({ type: 'SET_FRAGMENT_COLOR', laneIndex: lane, index: fragIdx!, color })
              }
            />
          </div>

          <div
            className={styles.sliders}
            style={{
              left: `${LAYOUT.fragViewSlidersTopLeft.x}px`,
              top:  `${LAYOUT.fragViewSlidersTopLeft.y}px`,
              gap:  `${SLIDER_GAP - 26}px`,  // 26 ≈ slider track height; gap is between rows
              width: SLIDER_W + ICON_GUTTER * 2 + ICON_SIZE.x * 2,
            }}
          >
            <SliderView
              testId="frag-size"
              config={{
                style: 'slider',
                valueMin: SIZE_MIN,
                valueMax: SIZE_MAX,
                quantize: 100,
                formatValue: fmtBp,
              }}
              value={fragment.bases}
              onChange={(v) =>
                dispatch({ type: 'SET_FRAGMENT_BASES', laneIndex: lane, index: fragIdx!, bases: Math.round(v) })
              }
              iconLo="/assets/slider-icons/size-lo.png"
              iconHi="/assets/slider-icons/size-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-mass"
              config={{
                style: 'slider',
                valueMin: MASS_MIN,
                valueMax: MASS_MAX,
                quantize: 0,
                formatValue: fmtNg,
              }}
              value={fragment.mass}
              onChange={(mass) =>
                dispatch({ type: 'SET_FRAGMENT_MASS', laneIndex: lane, index: fragIdx!, mass })
              }
              iconLo="/assets/slider-icons/concentration-lo.png"
              iconHi="/assets/slider-icons/concentration-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-aspect"
              config={{
                style: 'slider',
                valueMin: ASPECT_MIN,
                valueMax: ASPECT_MAX,
                quantize: 1,
                formatValue: fmtAsp,
              }}
              value={fragment.aspectRatio}
              onChange={(aspectRatio) =>
                dispatch({ type: 'SET_FRAGMENT_ASPECT', laneIndex: lane, index: fragIdx!, aspectRatio })
              }
              iconLo="/assets/slider-icons/aspect-lo.png"
              iconHi="/assets/slider-icons/aspect-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-aggregate"
              config={{
                style: 'graph',
                valueMin: 1,
                valueMax: AGG_MAX_MULTIMER,
                quantize: 0,
              }}
              value={0}
              onChange={() => undefined}
              graphValues={
                fragment.aggregate.length === AGG_MAX_MULTIMER
                  ? [...fragment.aggregate]
                  : aggregateToColumns(fragment.aggregate, AGG_MAX_MULTIMER)
              }
              onGraphChange={(values) =>
                dispatch({ type: 'SET_FRAGMENT_AGGREGATE', laneIndex: lane, index: fragIdx!, aggregate: values })
              }
              iconLo="/assets/slider-icons/multimer-lo.png"
              iconHi="/assets/slider-icons/multimer-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-degrade"
              config={{
                style: 'slider',
                valueMin: 0,
                valueMax: 2,
                quantize: 0,
                notches: [0, 0.5, 1],
                notchAction: 'snap',
                notchSnapDist: 0.04,
                formatValue: fmtDeg,
              }}
              value={fragment.degrade}
              onChange={(degrade) =>
                dispatch({ type: 'SET_FRAGMENT_DEGRADE', laneIndex: lane, index: fragIdx!, degrade })
              }
              iconLo="/assets/slider-icons/degrade-lo.png"
              iconHi="/assets/slider-icons/degrade-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Pad a sparse aggregate weight array out to `n` columns for the graph slider.
 * The C++ Aggregate is a variable-length weight array indexed by (multimer-1).
 * For UI editing we want a fixed-width histogram of length n.
 */
function aggregateToColumns(agg: readonly number[], n: number): number[] {
  const out = new Array<number>(n).fill(0);
  // index 0 = monomer (always present at full weight by convention; ensure non-zero so the column is visible)
  out[0] = agg.length > 0 ? Math.max(0.001, agg[0]) : 1;
  for (let i = 1; i < n; i++) {
    out[i] = i < agg.length ? agg[i] : 0;
  }
  return out;
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd /Users/shawn/code/gel/ts && npx tsc --noEmit
git add src/components/inspector/FragmentView.tsx src/components/inspector/FragmentView.module.css
git commit -m "feat(inspector): FragmentView (Species panel) — well + palette + 5 sliders"
```

---

## Task 5: InspectorPanel + GelPage swap

**Files:**
- Create: `ts/src/components/inspector/InspectorPanel.tsx`
- Modify: `ts/src/routes/GelPage.tsx`
- Delete: `ts/src/components/stage/InspectorPlaceholder.tsx`

InspectorPanel reads `inspectorMode` and `selection` to choose what to render. M14 implements the Species path; the other modes return placeholders for now (replaced by M16/M17).

- [ ] **Step 1: Create InspectorPanel**

Create `/Users/shawn/code/gel/ts/src/components/inspector/InspectorPanel.tsx`:

```tsx
import { useGelState } from '../gel/GelContext';
import { FragmentView } from './FragmentView';
import { LAYOUT } from '../../lib/layout/layout';

/**
 * Routes the right-panel content based on inspector mode + selection state.
 * - inspectorMode === 'gel-settings' → GelSettingsView (M17 stub)
 * - microtube selected, no fragment → SampleSettingsView (M16 stub)
 * - else → FragmentView (Species — default)
 */
export function InspectorPanel() {
  const state = useGelState();

  let body: React.ReactNode;
  let heading: string;

  if (state.inspectorMode === 'gel-settings') {
    heading = LAYOUT.gelSettingsHeaderStr;     // "Gel"
    body = <ModeStub label="Gel settings — coming in M17" />;
  } else if (state.selectedFragmentIndex === null && state.samples[state.selectedLane] !== null) {
    heading = LAYOUT.sampleSettingsHeaderStr;  // "Buffer + Dyes"
    body = <ModeStub label="Sample buffer + dyes — coming in M16" />;
  } else {
    // Default: Species (FragmentView). Shown when a fragment is selected, OR when
    // there's no sample (FragmentView itself renders an "empty" message).
    heading = LAYOUT.fragViewHeaderStr;        // "Species"
    body = <FragmentView />;
  }

  // FragmentView renders its own heading internally. Other modes don't yet.
  // To avoid double-rendering "Species", FragmentView is rendered raw and the
  // outer panel only shows a heading for the stub modes.
  if (state.inspectorMode !== 'gel-settings' && (state.selectedFragmentIndex !== null || state.samples[state.selectedLane] === null)) {
    return <div data-testid="inspector-panel" style={{ width: '100%', height: '100%' }}>{body}</div>;
  }

  return (
    <div
      data-testid="inspector-panel"
      style={{ width: '100%', height: '100%', position: 'relative', background: '#FFFFFF' }}
    >
      <h2
        style={{
          position: 'absolute',
          left:     `${LAYOUT.gelSettingsHeaderBaselinePos.x}px`,
          top:      `${LAYOUT.gelSettingsHeaderBaselinePos.y}px`,
          margin:   0,
          font:     `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
          color:    LAYOUT.headFontColor,
          lineHeight: 1,
        }}
      >
        {heading}
      </h2>
      <div style={{ paddingTop: 60 }}>{body}</div>
    </div>
  );
}

function ModeStub({ label }: { label: string }) {
  return (
    <div style={{ padding: 24, color: '#666', fontFamily: 'Inter', fontSize: 13 }}>
      {label}
    </div>
  );
}
```

- [ ] **Step 2: Update GelPage**

Edit `/Users/shawn/code/gel/ts/src/routes/GelPage.tsx`:

Replace:
```tsx
import { InspectorPlaceholder } from '../components/stage/InspectorPlaceholder';
```
with:
```tsx
import { InspectorPanel } from '../components/inspector/InspectorPanel';
```

In the `<Stage>` JSX, replace:
```tsx
right={<InspectorPlaceholder />}
```
with:
```tsx
right={<InspectorPanel />}
```

- [ ] **Step 3: Delete InspectorPlaceholder**

```bash
cd /Users/shawn/code/gel/ts
rm src/components/stage/InspectorPlaceholder.tsx
```

- [ ] **Step 4: Compile + boot**

```bash
cd /Users/shawn/code/gel/ts
npx tsc --noEmit
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m14-vite.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5173/#/gel"
```

Expected: 200. Open http://localhost:5173/#/gel and confirm:
- Right panel shows "Species" heading (not "Gel")
- Below the heading: 80×80 well preview at correct position
- 4×3 color palette grid
- 5 sliders stacked: size, mass, aspect, aggregate (graph), degrade
- Clicking a swatch changes the band color (you'll see the visual change in the gel canvas only on next render — band coloring is a Phase-1 thing)
- Dragging the size slider changes "420 bp" (or whatever) and band moves on the gel
- Clicking the gear button shows the "Gel settings — coming in M17" stub

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/components/inspector/InspectorPanel.tsx src/routes/GelPage.tsx
git rm src/components/stage/InspectorPlaceholder.tsx
git commit -m "feat(inspector): InspectorPanel routes by mode/selection; remove InspectorPlaceholder"
```

---

## Task 6: Playwright + tag

**Files:**
- Create: `ts/tests/visual/fragment-view.spec.ts`

- [ ] **Step 1: Write the test**

Create `/Users/shawn/code/gel/ts/tests/visual/fragment-view.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('Species panel renders with header + well + palette + 5 sliders', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // FragmentView mounts inside InspectorPanel
  await expect(page.getByTestId('fragment-view')).toBeVisible();

  // "Species" heading
  await expect(page.getByText('Species', { exact: true })).toBeVisible();

  // The 5 sliders by testId
  await expect(page.getByTestId('frag-size')).toBeVisible();
  await expect(page.getByTestId('frag-mass')).toBeVisible();
  await expect(page.getByTestId('frag-aspect')).toBeVisible();
  await expect(page.getByTestId('frag-aggregate')).toBeVisible();
  await expect(page.getByTestId('frag-degrade')).toBeVisible();

  // Well preview + palette
  await expect(page.getByTestId('fragment-well')).toBeVisible();
  await expect(page.getByTestId('fragment-palette')).toBeVisible();
});

test('Species panel does not show the heading "Gel"', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // The right inspector slot should NOT contain the literal text "Gel" as a header
  // (Some elements may contain "Gel" as part of larger text — we check the inspector specifically)
  const inspector = page.getByTestId('inspector-panel');
  await expect(inspector).toBeVisible();
  // Ensure the panel doesn't show only "Gel" — it shows "Species"
  const text = await inspector.innerText();
  expect(text).toContain('Species');
});

test('Clicking a palette swatch updates the fragment color via reducer', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Click swatch 1 (red, #cc0000); the well should reflect the new color
  await page.getByTestId('fragment-palette-swatch-1').click();
  // The swatch should now read aria-pressed="true"
  await expect(page.getByTestId('fragment-palette-swatch-1')).toHaveAttribute('aria-pressed', 'true');
});

test('Settings gear button switches inspector to "Gel" stub', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Default: Species
  await expect(page.getByTestId('fragment-view')).toBeVisible();

  // Click gear
  await page.getByTestId('settings-button').click();

  // Now the inspector should show the gel-settings stub
  const inspector = page.getByTestId('inspector-panel');
  await expect(inspector).toContainText('Gel');
  await expect(page.getByTestId('fragment-view')).toBeHidden();
});
```

- [ ] **Step 2: Run new test**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test tests/visual/fragment-view.spec.ts --project=chromium-webgpu 2>&1 | tail -10
```

Expected: 4 pass.

- [ ] **Step 3: Run full Playwright**

```bash
cd /Users/shawn/code/gel/ts
npx playwright test 2>&1 | tail -15
```

Expected: 34/34 per backend = 68 total. If existing tests fail because they expected the inspector heading to be "Gel" (unlikely but possible), update those locators.

- [ ] **Step 4: Commit + tag + push**

```bash
cd /Users/shawn/code/gel/ts
git add tests/visual/fragment-view.spec.ts
git commit -m "test(fragment-view): mount + palette + gear toggle + heading checks"

# Update plan checkboxes
cd /Users/shawn/code/gel
# Edit docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md:
#   change `- [ ] **M14 FragmentView ...** — TBD — next-execute` to `- [x] ...`
#   change `- [ ] **M15 SampleView middle panel** — TBD` to `... — next-execute`
git add docs/superpowers/plans/
git commit -m "docs(plan): mark M14 FragmentView (Species) complete"
git tag m14-fragment-view
git push && git push --tags
```

## Acceptance

- Right inspector defaults to Species panel with header "Species" (not "Gel")
- 80×80 well preview + 4×3 palette + 5 sliders all visible and connected via reducer
- Gear button swaps to "Gel settings — coming in M17" stub
- Full unit + Playwright suites pass
- Tag `m14-fragment-view` pushed

---

## Notes for the implementer

**Why FragmentView is now M14 (was M17):** User feedback after M13 — the inspector defaults to "Species" in the C++ Gelbox, not "Gel". GelSettingsView is gear-toggled, secondary. Reordering brings the user-visible default into alignment sooner.

**Why we auto-select fragment 0 on LOAD_FIXTURE / initialState:** Without this, the panel renders "No fragment selected" on cold start, which is a worse first impression than just showing the editor primed with the first ladder fragment. Mirrors how the C++ app behaves after sample selection.

**Why FragmentView renders its own heading instead of letting InspectorPanel render it:** The fragment view header position (`fragViewHeaderBaselinePos`) is specific to that panel's layout — different from `gelSettingsHeaderBaselinePos`. Keeping the header inside FragmentView lets it own its baseline-relative positioning. The InspectorPanel renders a header only for the stub modes that don't yet have their own.

**Why aggregate slider value=0 and onChange=noop:** The Graph style ignores `value`/`onChange` in favor of `graphValues`/`onGraphChange` (which Graph supports). The base props are still required by `SliderViewProps`, so we pass throwaway defaults.

**Why we pad aggregate to 7 columns even if the data has fewer:** The graph slider renders one column per value; consistent column count matches the C++ behavior (`mSliderAggregateMaxMultimer = 7`) and gives users a fixed editing surface. The first column always shows at least 0.1% (visual hint that the monomer column exists even at low aggregate weights).
