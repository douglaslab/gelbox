# M11 — Three-Panel Stage Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc `GelPage.tsx` flex layout with a proper three-panel stage that matches `Layout.h` pixel-for-pixel on wide viewports (1365×768 frame, gel at `(208, 124)` size `390×520`, sample middle panel `362×520`, inspector `303×520`, brace between middle and right) and reflows to a single column on narrow viewports (≤1024px). Preserves all existing M6+M7+M8 functionality (band drag, sample drag, loupes, save/load).

**Architecture:** A new `<Stage>` component fixes a 1365×768 box with `transform-origin: top-left` and CSS scale-to-fit on viewports between 1024px and 1365px (preserving aspect ratio with letterboxing). Below 1024px it switches to a single-column flex layout — gel, then sample placeholder, then inspector. The existing `GelCanvas` + `GelOverlay` + `MicrotubeRow` move into the left-panel slot at the layout-correct origin; `GelControls` + `FileControls` move into the right-panel slot as a temporary occupant of the inspector (M13/M14/M16/M17 will replace them); a placeholder `<SampleViewPlaceholder>` occupies the middle-panel slot.

**Important coordinate change:** The existing reducer stores `gelSize: { width: 320, height: 240 }` (Phase 1 abstract units). M11 changes the initial value to `{ width: 390, height: 520 }` to match `LAYOUT.gelSize`, scaling well rects proportionally (the well-y coordinates `WELL_Y1=8`, `WELL_Y2=18` were tuned against 240-tall gel; for a 520-tall gel, they become `8 × (520/240) ≈ 17.3` and `18 × (520/240) ≈ 39`). Same proportional scaling is applied wherever a Phase 1 constant assumed the old dimensions.

**Tech Stack:** React 18, plain CSS modules (no Tailwind for the stage), existing `LAYOUT` from M10.

---

## File structure

```
ts/
  src/
    components/
      stage/
        Stage.tsx              # CREATE — 1365×768 frame, scale-to-fit, narrow reflow
        Stage.module.css       # CREATE — media queries, scale logic, panel slot styling
        Brace.tsx              # CREATE — vertical brace PNG between middle and right panels
        SampleViewPlaceholder.tsx  # CREATE — empty middle-panel placeholder with heading
        InspectorPlaceholder.tsx   # CREATE — wraps current GelControls + FileControls until M14/M16/M17
    routes/
      GelPage.tsx              # MODIFY — replace ad-hoc flex with <Stage>
    lib/
      gel/
        gelState.ts            # MODIFY — gelSize 320×240 → 390×520, well y-coords scaled
  tests/
    unit/
      gelState.test.ts         # MODIFY — adjust any tests that referenced old dimensions
    visual/
      stage.spec.ts            # CREATE — Playwright golden + responsive reflow check
```

---

## Task 1: Update gelState dimensions to match Layout

**Files:**
- Modify: `ts/src/lib/gel/gelState.ts`
- Modify (if needed): `ts/tests/unit/gelState.test.ts`

The current `GEL_SIZE = { width: 320, height: 240 }` mismatches `LAYOUT.gelSize = { x: 390, y: 520 }`. Bring them into alignment, scaling well y-coords proportionally so wells still sit ~3-8% from the top.

- [ ] **Step 1: Read existing constants and any tests that reference them**

```bash
cd /Users/shawn/code/gel/ts
grep -n "GEL_SIZE\|WELL_Y1\|WELL_Y2\|gelSize\.width\|gelSize\.height" src/ tests/ -r 2>/dev/null
```

Note every site. The reducer uses `gelSize` indirectly via `wellRects`; render components read `state.gelSize` for canvas sizing.

- [ ] **Step 2: Modify the constants**

Edit `ts/src/lib/gel/gelState.ts`. Change these three lines near the top:

```ts
const NUM_LANES = 7;
const GEL_SIZE = { width: 390, height: 520 };
const WELL_Y1 = 17;   // was 8 (240-tall gel); 8 × (520/240) ≈ 17.3 → 17
const WELL_Y2 = 39;   // was 18 (240-tall gel); 18 × (520/240) = 39
```

These constants match `LAYOUT.gelSize` and preserve the same well-band-vs-gel proportions.

- [ ] **Step 3: Run unit tests; fix any that break due to numeric expectations**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

If tests fail, they're likely asserting on the old `gelSize` or `WELL_Y1/Y2`. Update those expectations to the new values. Do NOT relax assertions to floating-point tolerance — the new constants are exact.

- [ ] **Step 4: Run Playwright; expect goldens to fail**

```bash
cd /Users/shawn/code/gel/ts && lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test --project=chromium-webgpu 2>&1 | tail -30
```

The gel-canvas goldens (`single-band.spec.ts`, `multi-band.spec.ts`, `sim-ladder.spec.ts`) WILL fail because the rendered gel changed size. We will regenerate them at the end of this task.

- [ ] **Step 5: Regenerate goldens for both backends**

```bash
cd /Users/shawn/code/gel/ts
npx playwright test --update-snapshots --project=chromium-webgpu 2>&1 | tail -10
npx playwright test --update-snapshots --project=chromium-webgl2 2>&1 | tail -10
```

Then re-run without `--update-snapshots` to confirm everything passes:

```bash
npx playwright test 2>&1 | tail -10
```

Expected: 22/22 per backend = 44 passing. Note: golden regeneration is a one-time effect of changing the rendered gel size; this is intentional, not a regression.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/lib/gel/gelState.ts tests/unit/gelState.test.ts tests/visual/__screenshots__/
git commit -m "refactor(state): gelSize 320x240 -> 390x520 to match Layout; well-y scaled proportionally"
```

---

## Task 2: Stage component (frame + scaling)

**Files:**
- Create: `ts/src/components/stage/Stage.tsx`
- Create: `ts/src/components/stage/Stage.module.css`

The Stage hosts three named slots (`left`, `middle`, `right`) in absolute-positioned children at exact `LAYOUT` pixel coordinates. On wide viewports the stage size is `LAYOUT.windowSize` (1365×768) with no scale; on viewports between 1024px and 1365px it uses `transform: scale()` proportional to viewport width with `transform-origin: top-left`; below 1024px it ungrids the absolute layout and stacks children vertically.

- [ ] **Step 1: Create `Stage.module.css`**

```css
/* Wide layout: fixed 1365x768 absolute-positioned panel slots */
.stage {
  position: relative;
  width: 1365px;
  height: 768px;
  margin: 0 auto;
  background: #FFFFFF;
}

.slot {
  position: absolute;
}

/* Brace sits between middle and right slot in wide layout only */
.braceWrap {
  position: absolute;
}

/* On viewports between 1024 and 1365 px wide, scale the whole stage proportionally,
   keeping the top-left fixed and letterboxing on the right via overflow hidden on the host. */
@media (min-width: 1024px) and (max-width: 1364px) {
  .stage {
    transform-origin: top left;
    /* The transform value is set inline by the component based on viewport width. */
  }
}

/* Narrow layout: stack children vertically as a single column, ignoring absolute coords. */
@media (max-width: 1023px) {
  .stage {
    width: 100%;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 16px;
    box-sizing: border-box;
  }

  .slot,
  .braceWrap {
    position: static;
  }

  .braceWrap {
    /* hide the brace in narrow layout — it's a wide-only divider */
    display: none;
  }
}
```

- [ ] **Step 2: Create `Stage.tsx`**

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import styles from './Stage.module.css';

export interface StageProps {
  left:   ReactNode;
  middle: ReactNode;
  right:  ReactNode;
  brace?: ReactNode;
}

const NARROW_BREAKPOINT = 1024;

function useViewportScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= LAYOUT.windowSize.x) {
        setScale(1);
      } else if (w >= NARROW_BREAKPOINT) {
        setScale(w / LAYOUT.windowSize.x);
      } else {
        setScale(1); // narrow layout doesn't scale; CSS reflow takes over
      }
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}

/**
 * Three-panel stage matching Cinder Gelbox layout (1365x768).
 * - Wide (>= 1365px): static absolute-positioned panels at exact LAYOUT coords.
 * - Mid (1024-1364px): same layout, CSS-scaled to fit viewport width.
 * - Narrow (< 1024px): single-column stack (gel, sample, inspector); brace hidden.
 */
export function Stage({ left, middle, right, brace }: StageProps) {
  const scale = useViewportScale();

  // Compute absolute positions from LAYOUT
  const leftStyle = {
    left:   `${LAYOUT.gelTopLeft.x}px`,
    top:    `${LAYOUT.gelTopLeft.y}px`,
    width:  `${LAYOUT.gelSize.x}px`,
    height: `${LAYOUT.gelSize.y}px`,
  };

  const middleX = LAYOUT.gelTopLeft.x + LAYOUT.gelSize.x + LAYOUT.gelToSampleGutter;
  const middleStyle = {
    left:   `${middleX}px`,
    top:    `${LAYOUT.gelTopLeft.y}px`,
    width:  `${LAYOUT.sampleSize.x}px`,
    height: `${LAYOUT.sampleSize.y}px`,
  };

  const braceX = middleX + LAYOUT.sampleSize.x + LAYOUT.sampleToBraceGutter;
  const braceStyle = {
    left:   `${braceX}px`,
    top:    `${LAYOUT.gelTopLeft.y + (LAYOUT.gelSize.y - LAYOUT.braceSize.y) / 2}px`,
    width:  `${LAYOUT.braceSize.x}px`,
    height: `${LAYOUT.braceSize.y}px`,
  };

  const rightX = braceX + LAYOUT.braceSize.x;
  const rightStyle = {
    left:   `${rightX}px`,
    top:    `${LAYOUT.gelTopLeft.y}px`,
    width:  `${LAYOUT.gelSettingsSize.x}px`,
    height: `${LAYOUT.gelSettingsSize.y}px`,
  };

  // Inline transform for the mid-viewport scale band; CSS handles narrow.
  const stageStyle = scale < 1 && scale > 0
    ? { transform: `scale(${scale})` }
    : undefined;

  return (
    <div className={styles.stage} style={stageStyle} data-testid="stage">
      <div className={styles.slot} style={leftStyle}   data-testid="stage-left">{left}</div>
      <div className={styles.slot} style={middleStyle} data-testid="stage-middle">{middle}</div>
      {brace && (
        <div className={styles.braceWrap} style={braceStyle} data-testid="stage-brace">{brace}</div>
      )}
      <div className={styles.slot} style={rightStyle}  data-testid="stage-right">{right}</div>
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd /Users/shawn/code/gel/ts && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/components/stage/Stage.tsx src/components/stage/Stage.module.css
git commit -m "feat(stage): three-panel Stage component (1365x768 wide, scale-to-fit, narrow reflow)"
```

---

## Task 3: Brace component

**Files:**
- Create: `ts/src/components/stage/Brace.tsx`

A trivial wrapper around the brace PNG that uses our scale-aware loader.

- [ ] **Step 1: Create `Brace.tsx`**

```tsx
import { resolveAssetUrl } from '../../lib/layout/assets';
import { LAYOUT } from '../../lib/layout/layout';

/**
 * Vertical brace graphic that sits between the sample panel and the inspector
 * in the wide layout. The PNG is `assets/brace.png` (44x465) and is sized
 * exactly to LAYOUT.braceSize.
 */
export function Brace() {
  return (
    <img
      src={resolveAssetUrl('/assets/brace.png')}
      alt=""
      width={LAYOUT.braceSize.x}
      height={LAYOUT.braceSize.y}
      style={{ display: 'block', userSelect: 'none', pointerEvents: 'none' }}
      data-testid="brace"
    />
  );
}
```

- [ ] **Step 2: Verify compilation + commit**

```bash
cd /Users/shawn/code/gel/ts
npx tsc --noEmit
git add src/components/stage/Brace.tsx
git commit -m "feat(stage): Brace component renders /assets/brace.png at LAYOUT size"
```

---

## Task 4: Placeholders for middle and right slots

**Files:**
- Create: `ts/src/components/stage/SampleViewPlaceholder.tsx`
- Create: `ts/src/components/stage/InspectorPlaceholder.tsx`

These are intentionally minimal — they're stand-ins for M15 (sample), M14/M16/M17 (inspectors). Each renders a heading at the correct baseline and a colored panel. The InspectorPlaceholder hosts the existing `GelControls` + `FileControls` so the app remains functional during the transition.

- [ ] **Step 1: Create `SampleViewPlaceholder.tsx`**

```tsx
import { LAYOUT } from '../../lib/layout/layout';

/**
 * Placeholder for the middle "Sample" panel. M15 will replace this with a
 * proper SampleView containing the molecular simulation canvas.
 *
 * For now: a light-gray rectangle with the C++ "Sample" heading at the
 * layout-correct baseline, so the visual frame is right even though the
 * content is empty.
 */
export function SampleViewPlaceholder() {
  return (
    <div
      style={{
        width:  '100%',
        height: '100%',
        position: 'relative',
        background: LAYOUT.molecularSimBkgndColor,
        borderRadius: LAYOUT.gelMicrotubeBkgndCornerRadius,
      }}
      data-testid="sample-view-placeholder"
    >
      <h2
        style={{
          position: 'absolute',
          left:     `${LAYOUT.sampleViewHeaderBaselinePos.x}px`,
          top:      `${LAYOUT.sampleViewHeaderBaselinePos.y}px`,  // negative; sits above panel top
          margin:   0,
          font:     `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
          color:    LAYOUT.headFontColor,
          lineHeight: 1,
        }}
      >
        {LAYOUT.sampleViewHeaderStr}
      </h2>
    </div>
  );
}
```

- [ ] **Step 2: Create `InspectorPlaceholder.tsx`**

```tsx
import { LAYOUT } from '../../lib/layout/layout';
import { GelControls } from '../chrome/GelControls';
import { FileControls } from '../chrome/FileControls';

/**
 * Placeholder for the right "Inspector" panel. M14/M16/M17 will replace this with
 * GelSettingsView / SampleSettingsView / FragmentView respectively. For now: hosts
 * the existing GelControls + FileControls so the app stays usable.
 */
export function InspectorPlaceholder() {
  return (
    <div
      style={{
        width:    '100%',
        height:   '100%',
        position: 'relative',
        background: '#FFFFFF',
      }}
      data-testid="inspector-placeholder"
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
        {LAYOUT.gelSettingsHeaderStr}
      </h2>
      <div style={{ position: 'absolute', top: 32, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <GelControls />
        <FileControls />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd /Users/shawn/code/gel/ts
npx tsc --noEmit
git add src/components/stage/SampleViewPlaceholder.tsx src/components/stage/InspectorPlaceholder.tsx
git commit -m "feat(stage): SampleViewPlaceholder + InspectorPlaceholder with layout-correct headings"
```

---

## Task 5: Refactor GelPage to use Stage

**Files:**
- Modify: `ts/src/routes/GelPage.tsx`

Replace the ad-hoc flex layout with `<Stage>`. The left slot wraps the existing `MicrotubeRow` + `GelCanvas` + `GelOverlay`; the middle slot uses `SampleViewPlaceholder`; the right slot uses `InspectorPlaceholder`. The brace renders between middle and right.

- [ ] **Step 1: Read the current `GelPage.tsx` to plan the refactor**

```bash
cd /Users/shawn/code/gel/ts && cat src/routes/GelPage.tsx
```

The `GelInner` function has:
- A `<section>` wrapper with padding+maxWidth (delete)
- `<h1>Gel</h1>` heading (delete — Stage handles per-panel headings)
- A flex row containing controls column and gel column (delete the wrapper, distribute children to slots)
- Selection-info text (move into InspectorPlaceholder area, or keep at bottom of left slot for now)
- Drop error display (keep, position absolutely top-right of stage)
- LoupePortalLayer (keep, render outside the Stage so it portals to viewport)

- [ ] **Step 2: Rewrite `GelInner` and `GelPage`**

Replace the contents of `ts/src/routes/GelPage.tsx` with the version below. Preserve all existing imports + the `bands`/`bandToLaneFragment` memo + the `onDrop` handler — only the JSX changes.

```tsx
import { useMemo, useState } from 'react';
import { GelProvider, useGelState, useGelDispatch } from '../components/gel/GelContext';
import { GelCanvas } from '../components/gel/GelCanvas';
import { GelOverlay, type BandLaneFragment } from '../components/gel/GelOverlay';
import { MicrotubeRow } from '../components/gel/MicrotubeRow';
import { LoupePortalLayer } from '../components/gel/LoupePortalLayer';
import { Stage } from '../components/stage/Stage';
import { Brace } from '../components/stage/Brace';
import { SampleViewPlaceholder } from '../components/stage/SampleViewPlaceholder';
import { InspectorPlaceholder } from '../components/stage/InspectorPlaceholder';
import { fragToBands } from '../lib/sim/gelSim';
import { deserializeFile } from '../lib/gel/serialize';
import type { Band } from '../lib/sim/band';

function GelInner() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const [dropError, setDropError] = useState<string | null>(null);

  const { bands, bandToLaneFragment } = useMemo(() => {
    const bands: Band[] = [];
    const bandToLaneFragment: BandLaneFragment[] = [];
    for (let lane = 0; lane < state.numLanes; lane++) {
      const sample = state.samples[lane];
      if (!sample) continue;
      for (let fragi = 0; fragi < sample.fragments.length; fragi++) {
        const out = fragToBands(sample, fragi, state.wellRects[lane], lane, state.ctx);
        for (const b of out) {
          bands.push(b);
          bandToLaneFragment.push({ lane, fragment: fragi });
        }
      }
    }
    return { bands, bandToLaneFragment };
  }, [state.samples, state.ctx, state.wellRects, state.numLanes]);

  async function onDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    setDropError(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = deserializeFile(text);
      if (result.kind === 'sample') {
        dispatch({ type: 'LOAD_FIXTURE', key: file.name.replace(/\.json$/i, ''), sample: result.sample, lane: state.selectedLane });
      } else {
        dispatch({ type: 'LOAD_GEL_STATE', samples: result.samples, numLanes: result.numLanes, ctx: result.ctx });
      }
    } catch (err) {
      setDropError(`Drop failed: ${(err as Error).message}`);
    }
  }

  // The gel canvas + overlay + microtube row form the LEFT panel content.
  // The microtube row floats above the gel canvas; both share width.
  const leftPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <MicrotubeRow />
      <div style={{ position: 'relative', flex: '1 1 auto' }}>
        <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
        <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
      </div>
    </div>
  );

  return (
    <div
      data-testid="gel-page"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ minHeight: '100vh', overflow: 'hidden' }}
    >
      <Stage
        left={leftPanel}
        middle={<SampleViewPlaceholder />}
        right={<InspectorPlaceholder />}
        brace={<Brace />}
      />
      {dropError && (
        <div
          data-testid="drop-error"
          style={{ position: 'fixed', top: 8, right: 8, color: '#c44', fontSize: 12, background: '#fff', padding: '4px 8px', borderRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
        >
          {dropError}
        </div>
      )}
      <LoupePortalLayer />
    </div>
  );
}

export function GelPage() {
  return (
    <GelProvider>
      <GelInner />
    </GelProvider>
  );
}
```

- [ ] **Step 3: Compile + boot dev server + visual sanity**

```bash
cd /Users/shawn/code/gel/ts
npx tsc --noEmit
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m11-vite.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
```

Expected: `200`. Open http://localhost:5173/#/gel and confirm:
- Three-panel layout visible at viewport >=1365px (gel left, "Sample" placeholder middle, "Gel" inspector right with controls)
- Brace PNG visible between middle and right
- Per-panel headings render in Inter at the correct font size
- Existing band drag, save, load, loupes still work
- Resize viewport to ~1200px; stage should scale down proportionally
- Resize viewport to ~600px; stage should reflow to single column with brace hidden

Don't proceed if any of these visually fail.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/routes/GelPage.tsx
git commit -m "refactor(gel-page): rebuild GelPage on top of Stage; left=gel, middle=sample placeholder, right=inspector placeholder"
```

---

## Task 6: Playwright stage test

**Files:**
- Create: `ts/tests/visual/stage.spec.ts`

A simple test that confirms the wide-viewport layout positions the three panel slots at LAYOUT-derived coordinates, the brace is visible between middle and right, and the narrow viewport reflows to a single column.

- [ ] **Step 1: Write the test**

Create `ts/tests/visual/stage.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('Stage renders three panel slots with brace at LAYOUT coords (wide viewport)', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  const stage = page.getByTestId('stage');
  await expect(stage).toBeVisible();

  const leftSlot   = page.getByTestId('stage-left');
  const middleSlot = page.getByTestId('stage-middle');
  const rightSlot  = page.getByTestId('stage-right');
  const brace      = page.getByTestId('stage-brace');

  await expect(leftSlot).toBeVisible();
  await expect(middleSlot).toBeVisible();
  await expect(rightSlot).toBeVisible();
  await expect(brace).toBeVisible();

  // Position checks: left slot at LAYOUT.gelTopLeft = (208, 124)
  const leftBox = await leftSlot.boundingBox();
  expect(leftBox?.x).toBeCloseTo(208, 0);
  expect(leftBox?.y).toBeCloseTo(124, 0);
  expect(leftBox?.width).toBeCloseTo(390, 0);
  expect(leftBox?.height).toBeCloseTo(520, 0);

  // Middle slot at gelTopLeft.x + gelSize.x + gelToSampleGutter = 208 + 390 + 30 = 628
  const middleBox = await middleSlot.boundingBox();
  expect(middleBox?.x).toBeCloseTo(628, 0);
  expect(middleBox?.width).toBeCloseTo(362, 0);

  // Right slot at middleX + sampleSize.x + sampleToBraceGutter + braceSize.x = 628 + 362 + 31 + 44 = 1065
  const rightBox = await rightSlot.boundingBox();
  expect(rightBox?.x).toBeCloseTo(1065, 0);
  expect(rightBox?.width).toBeCloseTo(303, 0);
});

test('Stage reflows to a single column on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1200 });
  await page.goto('/#/gel');

  const stage = page.getByTestId('stage');
  await expect(stage).toBeVisible();

  const leftSlot   = page.getByTestId('stage-left');
  const middleSlot = page.getByTestId('stage-middle');
  const rightSlot  = page.getByTestId('stage-right');
  const brace      = page.getByTestId('stage-brace');

  // In narrow layout: brace is hidden, panels stack vertically
  await expect(brace).toBeHidden();

  const leftBox   = await leftSlot.boundingBox();
  const middleBox = await middleSlot.boundingBox();
  const rightBox  = await rightSlot.boundingBox();

  // Each panel below the previous (Y increases monotonically)
  expect(middleBox?.y ?? 0).toBeGreaterThan(leftBox?.y ?? 0);
  expect(rightBox?.y ?? 0).toBeGreaterThan(middleBox?.y ?? 0);
});
```

- [ ] **Step 2: Run new test**

```bash
cd /Users/shawn/code/gel/ts
npx playwright test tests/visual/stage.spec.ts --project=chromium-webgpu 2>&1 | tail -15
```

Expected: 2 tests pass on each backend.

- [ ] **Step 3: Run full Playwright**

```bash
cd /Users/shawn/code/gel/ts
npx playwright test 2>&1 | tail -15
```

Expected: 24/24 per backend = 48 total. If existing `gel-page.spec.ts` tests rely on the old DOM structure (e.g., `<h1>Gel</h1>` heading or specific layout), they may need test updates — those are not visual goldens, so adjust the locators to match the new structure rather than relaxing the assertion.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add tests/visual/stage.spec.ts
git commit -m "test(stage): wide-viewport positions + narrow-viewport reflow"
```

---

## Task 7: Mark M11 done + tag

- [ ] **Step 1: Update plan files**

Edit `/Users/shawn/code/gel/docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md`. Change:
```
- [ ] **M11 Stage shell** — to be detail-planned before M11 starts — next-execute
```
to:
```
- [x] **M11 Stage shell** — `2026-05-01-gelbox-ts-m11-stage-shell.md`
```
and change:
```
- [ ] **M12 Slider primitives** — TBD
```
to:
```
- [ ] **M12 Slider primitives** — TBD — next-execute
```

- [ ] **Step 2: Commit + tag + push**

```bash
cd /Users/shawn/code/gel
git add docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md docs/superpowers/plans/2026-05-01-gelbox-ts-m11-stage-shell.md
git commit -m "docs(plan): mark M11 stage shell complete"
git tag m11-stage-shell
git push && git push --tags
```

---

## Notes for the implementer

**Why goldens regenerate in Task 1:** Changing `gelSize` from 320×240 to 390×520 changes pixel output of the gel canvas. The goldens captured during M2-M5 were against the old dimensions. We accept the one-time golden refresh as the cost of moving to layout-correct dimensions; this is documented in the commit message.

**Why CSS modules for Stage but inline styles for placeholders:** Stage has scaling behavior tied to media queries that benefit from CSS classes; placeholder content is one-shot and ephemeral (M14+ replace it), so inline styles are fine.

**Inspector heading reads "Gel" but is a placeholder:** That's intentional — `LAYOUT.gelSettingsHeaderStr` is `'Gel'` because in the C++ app the inspector defaults to GelSettingsView when no microtube is selected. Once M14 ships GelSettingsView, that's the heading we want. M16+M17 will swap it dynamically based on selection state.

**What if the wide layout overflows the viewport horizontally?** Set `overflow: hidden` on the page wrapper (already in the rewritten GelPage). Above 1365px the stage centers via `margin: 0 auto`; between 1024 and 1365 it scales; below 1024 it reflows. There should be no horizontal scrollbar in any of these ranges.

**Why we don't move existing `GelControls` and `FileControls` files yet:** They're scheduled for replacement in M14/M16/M17. Ripping them out now without replacement breaks the demo. Moving them inside the inspector slot keeps the app functional.
