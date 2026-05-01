# M13 — GelView Pixel Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the left-panel `GelView` (microtube row + gel canvas + overlay) closer to C++ pixel parity: real microtube PNG icons in rounded backgrounds at `LAYOUT.gelMicrotubeBkgndColor`, a 32×32 gear settings button in the lower-right of the gel, band focus + rollover highlight using `LAYOUT.sampleViewFragSelectColor` (black, width 4) and `sampleViewFragHoverColor` (yellow), and an `inspectorMode` reducer slice that the gear button toggles (M14 reads it to swap inspector content).

**Architecture:** The existing `GelCanvas` (WebGPU/WebGL2) is unchanged — bands render on the canvas. `GelOverlay` (SVG) gains a hover handler that dispatches `SET_ROLLOVER`, and updates its select/hover stroke colors to match `Layout.h`. `MicrotubeRow` is rewritten as an HTML row of `<button>` elements styled with PNGs and Layout colors instead of generic SVG circles. A new `SettingsButton` component renders a gear PNG; placed inside the left slot of the Stage at the gel's bottom-right.

The reducer adds `inspectorMode: 'default' | 'gel-settings' | 'sample-settings' | 'fragment'` plus a `SET_INSPECTOR_MODE` action. M13 does not consume this beyond toggling — `InspectorPlaceholder` keeps showing GelControls + FileControls until M14 ships the real `GelSettingsView`.

---

## File structure

```
ts/
  src/
    lib/
      gel/
        gelState.ts            # MODIFY — add inspectorMode + SET_INSPECTOR_MODE
    components/
      gel/
        MicrotubeRow.tsx       # REWRITE — HTML+PNG, Layout colors
        MicrotubeRow.module.css # CREATE — tube background + selection
        GelOverlay.tsx         # MODIFY — Layout colors for select/hover; rollover dispatch
        SettingsButton.tsx     # CREATE — gear PNG button
  tests/
    unit/
      gelState.test.ts         # MODIFY — add inspectorMode test
    visual/
      gel-page.spec.ts         # MODIFY — adjust microtube locators if structure changed
      gelview.spec.ts          # CREATE — settings button + hover/select highlight
docs/
  superpowers/
    plans/
      2026-05-01-gelbox-ts-m13-gelview.md           # this file
      2026-05-01-gelbox-ts-phase-2-overview.md      # update at end
```

---

## Task 1: `inspectorMode` reducer slice

**Files:**
- Modify: `ts/src/lib/gel/gelState.ts`
- Modify: `ts/tests/unit/gelState.test.ts`

- [ ] **Step 1: Add type, state field, action, initial value, reducer case**

Edit `ts/src/lib/gel/gelState.ts`:

**1a.** Above the `GelState` interface, add:
```ts
export type InspectorMode = 'default' | 'gel-settings' | 'sample-settings' | 'fragment';
```

**1b.** In `GelState` interface (after `rollover`):
```ts
  inspectorMode: InspectorMode;
```

**1c.** In the `Action` union, append:
```ts
  | { type: 'SET_INSPECTOR_MODE'; mode: InspectorMode }
```

**1d.** In `initialGelState()`:
```ts
    inspectorMode: 'default',
```

**1e.** In `gelReducer`, before `default:`:
```ts
    case 'SET_INSPECTOR_MODE':
      if (state.inspectorMode === action.mode) return state;
      return { ...state, inspectorMode: action.mode };
```

- [ ] **Step 2: Append reducer test**

Append to `ts/tests/unit/gelState.test.ts`:

```ts
describe('gelReducer SET_INSPECTOR_MODE', () => {
  it('updates inspectorMode', () => {
    const s0 = initialGelState();
    expect(s0.inspectorMode).toBe('default');
    const s1 = gelReducer(s0, { type: 'SET_INSPECTOR_MODE', mode: 'gel-settings' });
    expect(s1.inspectorMode).toBe('gel-settings');
  });

  it('preserves identity when mode is unchanged', () => {
    const s0 = initialGelState();
    const s1 = gelReducer(s0, { type: 'SET_INSPECTOR_MODE', mode: 'default' });
    expect(s1).toBe(s0);
  });
});
```

- [ ] **Step 3: Run tests + commit**

```bash
cd /Users/shawn/code/gel/ts
npm run test:unit
git add src/lib/gel/gelState.ts tests/unit/gelState.test.ts
git commit -m "feat(state): add inspectorMode + SET_INSPECTOR_MODE action"
```

Expected: 178 + 2 = 180 unit tests passing.

---

## Task 2: SettingsButton component (gear icon)

**Files:**
- Create: `ts/src/components/gel/SettingsButton.tsx`

A 32×32 button with the gear PNG. Click toggles `inspectorMode` between `'default'` and `'gel-settings'`.

- [ ] **Step 1: Create the component**

Create `ts/src/components/gel/SettingsButton.tsx`:

```tsx
import { LAYOUT } from '../../lib/layout/layout';
import { resolveAssetUrl } from '../../lib/layout/assets';
import { useGelDispatch, useGelState } from './GelContext';

/**
 * 32×32 gear button that toggles inspector between default and gel-settings mode.
 * Matches the C++ Gelbox `mSettingsBtn` (assets/settings.png, mBtnSize 32×32).
 */
export function SettingsButton() {
  const state    = useGelState();
  const dispatch = useGelDispatch();

  const active = state.inspectorMode === 'gel-settings';

  function onClick() {
    dispatch({
      type: 'SET_INSPECTOR_MODE',
      mode: active ? 'default' : 'gel-settings',
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="settings-button"
      aria-label="Toggle gel settings"
      aria-pressed={active}
      style={{
        width:    LAYOUT.btnSize.x,
        height:   LAYOUT.btnSize.y,
        padding:  0,
        border:   0,
        background: active ? LAYOUT.btnDownColor : 'transparent',
        borderRadius: 4,
        cursor:   'pointer',
      }}
    >
      <img
        src={resolveAssetUrl('/assets/settings.png')}
        alt=""
        width={LAYOUT.btnSize.x}
        height={LAYOUT.btnSize.y}
        style={{ display: 'block' }}
      />
    </button>
  );
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd /Users/shawn/code/gel/ts
npx tsc --noEmit
git add src/components/gel/SettingsButton.tsx
git commit -m "feat(gel): SettingsButton (gear PNG) toggles inspectorMode gel-settings"
```

---

## Task 3: Reskin MicrotubeRow

**Files:**
- Rewrite: `ts/src/components/gel/MicrotubeRow.tsx`
- Create: `ts/src/components/gel/MicrotubeRow.module.css`

The current implementation uses generic SVG circles. Replace with HTML row of buttons, each a rounded background rect (`LAYOUT.gelMicrotubeBkgndColor` / `gelMicrotubeBkgndColorSelected`) wrapping the `microtube1500ul.png` icon. Keep the existing drag/click/keyboard behavior — only the rendering changes.

- [ ] **Step 1: Create the CSS module**

Create `ts/src/components/gel/MicrotubeRow.module.css`:

```css
.row {
  display: flex;
  width: 100%;
  user-select: none;
}

.cell {
  flex: 1 1 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tube {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: #E8F2F3;       /* LAYOUT.gelMicrotubeBkgndColor */
  border-radius: 20px;       /* LAYOUT.gelMicrotubeBkgndCornerRadius */
  border: 0;
  padding: 8px 4px;
  cursor: grab;
  transition: background 80ms ease;
}

.tube:active { cursor: grabbing; }

.tube[data-selected="true"] {
  background: #A1D6FF;       /* LAYOUT.gelMicrotubeBkgndColorSelected */
}

.tube[data-empty="true"] {
  cursor: pointer;
  background: transparent;
}

.tube[data-dragging="true"] { opacity: 0.5; }

.icon {
  width: 24px;
  pointer-events: none;
  user-select: none;
}

.label {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 11px;
  color: #777;
  margin-top: 4px;
  pointer-events: none;
  user-select: none;
}
```

- [ ] **Step 2: Rewrite the component**

Replace `ts/src/components/gel/MicrotubeRow.tsx` with:

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { useGelState, useGelDispatch } from './GelContext';
import { resolveAssetUrl } from '../../lib/layout/assets';
import styles from './MicrotubeRow.module.css';

/**
 * Per-lane microtube row above the gel canvas. Each tube is a rounded
 * background rect with the C++ microtube1500ul.png icon centered inside.
 * Background color follows `LAYOUT.gelMicrotubeBkgndColor` /
 * `gelMicrotubeBkgndColorSelected`.
 */
export function MicrotubeRow() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const rowRef = useRef<HTMLDivElement>(null);

  const laneAtClientX = useCallback((clientX: number): number => {
    if (!rowRef.current) return state.selectedLane;
    const rect = rowRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const idx = Math.floor(x * state.numLanes);
    return Math.max(0, Math.min(state.numLanes - 1, idx));
  }, [state.numLanes, state.selectedLane]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!state.drag || state.drag.type !== 'sample') return;
    const targetLane = laneAtClientX(e.clientX);
    if (targetLane === state.drag.laneIndex) {
      dispatch({ type: 'END_SAMPLE_DRAG' });
      return;
    }
    if (e.altKey) {
      dispatch({ type: 'CLONE_SAMPLE_TO_LANE', from: state.drag.laneIndex, to: targetLane });
    } else {
      dispatch({ type: 'MOVE_SAMPLE', from: state.drag.laneIndex, to: targetLane });
    }
  }, [state.drag, laneAtClientX, dispatch]);

  useEffect(() => {
    if (!state.drag || state.drag.type !== 'sample') return;
    window.addEventListener('pointerup', onPointerUp);
    return () => { window.removeEventListener('pointerup', onPointerUp); };
  }, [state.drag, onPointerUp]);

  function onTubePointerDown(laneIndex: number, e: React.PointerEvent<HTMLButtonElement>) {
    if (state.samples[laneIndex] === null) {
      dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
      return;
    }
    e.preventDefault();
    dispatch({ type: 'BEGIN_SAMPLE_DRAG', laneIndex });
  }

  function onTubeClick(laneIndex: number) {
    dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
  }

  return (
    <div className={styles.row} ref={rowRef} data-testid="microtube-row">
      {Array.from({ length: state.numLanes }, (_, i) => {
        const isSelected = state.selectedLane === i;
        const hasSample  = state.samples[i] !== null;
        const dragging   = state.drag?.type === 'sample' && state.drag.laneIndex === i;
        return (
          <div className={styles.cell} key={i}>
            <button
              type="button"
              className={styles.tube}
              data-testid={`microtube-${i}`}
              data-lane-index={i}
              data-selected={isSelected || undefined}
              data-empty={!hasSample || undefined}
              data-dragging={dragging || undefined}
              onPointerDown={(e) => onTubePointerDown(i, e)}
              onClick={() => onTubeClick(i)}
            >
              {hasSample && (
                <img
                  src={resolveAssetUrl('/assets/microtube1500ul.png')}
                  alt=""
                  className={styles.icon}
                />
              )}
              <span className={styles.label}>{i + 1}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Compile**

```bash
cd /Users/shawn/code/gel/ts && npx tsc --noEmit
```

If the existing `gel-page.spec.ts` Playwright test queries for SVG-based microtube circles, it may need updates after Task 5. Continue.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/components/gel/MicrotubeRow.tsx src/components/gel/MicrotubeRow.module.css
git commit -m "refactor(gel): reskin MicrotubeRow with PNG + Layout colors (rounded rect tubes)"
```

---

## Task 4: GelOverlay focus + rollover

**Files:**
- Modify: `ts/src/components/gel/GelOverlay.tsx`

Changes:
- Replace `var(--color-accent, #66ccff)` selection stroke with `LAYOUT.sampleViewFragSelectColor` (`#000000`), width `LAYOUT.sampleViewFragOutlineWidth` (4)
- Add hover (rollover) state — yellow stroke `LAYOUT.sampleViewFragHoverColor` (`#FFFF00`), same width
- On pointer enter on a band, dispatch `SET_ROLLOVER` with `{ lane, fragmentIndex }`; on pointer leave, dispatch `SET_ROLLOVER` with `null`
- Read `state.rollover` to drive hover stroke

- [ ] **Step 1: Add the import**

At the top of `ts/src/components/gel/GelOverlay.tsx`, add:

```ts
import { LAYOUT } from '../../lib/layout/layout';
```

- [ ] **Step 2: Update band rendering**

Find the `bands.map((b, i) => { ... })` block. In the `return ( <rect ... /> )` JSX, replace the existing stroke line:

```tsx
stroke={selected ? 'var(--color-accent, #66ccff)' : 'transparent'}
strokeWidth={1}
```

with:

```tsx
stroke={
  selected
    ? LAYOUT.sampleViewFragSelectColor
    : (hovered ? LAYOUT.sampleViewFragHoverColor : 'transparent')
}
strokeWidth={LAYOUT.sampleViewFragOutlineWidth}
```

Above the `selected` const, add a `hovered` derivation:

```ts
const hovered  = state.rollover?.lane === lf.lane && state.rollover?.fragmentIndex === lf.fragment;
```

Add hover handlers to the rect:

```tsx
onPointerEnter={() => dispatch({ type: 'SET_ROLLOVER', ref: { lane: lf.lane, fragmentIndex: lf.fragment } })}
onPointerLeave={() => dispatch({ type: 'SET_ROLLOVER', ref: null })}
```

(Place these alongside `onPointerDown` on the rect.)

- [ ] **Step 3: Compile**

```bash
cd /Users/shawn/code/gel/ts && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/components/gel/GelOverlay.tsx
git commit -m "feat(gel-overlay): use LAYOUT colors for band select/hover; dispatch rollover"
```

---

## Task 5: Mount SettingsButton + Playwright

**Files:**
- Modify: `ts/src/routes/GelPage.tsx` (mount SettingsButton inside the left panel)
- Modify: existing `ts/tests/visual/gel-page.spec.ts` if locators broke (microtube reskin changed DOM)
- Create: `ts/tests/visual/gelview.spec.ts`

- [ ] **Step 1: Mount SettingsButton in GelPage left panel**

Edit `ts/src/routes/GelPage.tsx`. Add an import:

```ts
import { SettingsButton } from '../components/gel/SettingsButton';
```

Modify the `leftPanel` JSX to add the button at the bottom-right. The current structure is:

```tsx
const leftPanel = (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
    <MicrotubeRow />
    <div style={{ position: 'relative', flex: '1 1 auto' }}>
      <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
      <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
    </div>
  </div>
);
```

Add `<SettingsButton />` absolutely positioned inside the canvas wrapper:

```tsx
const leftPanel = (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
    <div style={{ flex: '0 0 auto' }}>
      <MicrotubeRow />
    </div>
    <div style={{ position: 'relative', flex: '1 1 auto' }}>
      <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
      <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
      <div style={{ position: 'absolute', right: 8, bottom: 8 }}>
        <SettingsButton />
      </div>
    </div>
  </div>
);
```

The MicrotubeRow wrapper gains `flex: '0 0 auto'` to keep the row from being squeezed when the canvas is tall (this was a noted M11.5 fix; preserve it).

- [ ] **Step 2: Compile + boot**

```bash
cd /Users/shawn/code/gel/ts
npx tsc --noEmit
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m13-vite.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5173/#/gel"
```

Expected: 200.

- [ ] **Step 3: Write the new gelview Playwright test**

Create `ts/tests/visual/gelview.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('Settings button toggles inspectorMode in state', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  const btn = page.getByTestId('settings-button');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
});

test('Microtube row uses PNG icons for samples', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  const tube0 = page.getByTestId('microtube-0');
  await expect(tube0).toBeVisible();
  // A sample is loaded by default in lane 0; expect the microtube PNG
  await expect(tube0.locator('img')).toBeVisible();
});

test('Hovering a band sets rollover stroke (yellow)', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 800 });
  await page.goto('/#/gel');

  // Locate first band rect
  const band = page.getByTestId('band-0');
  await expect(band).toBeAttached();

  await band.hover();
  // Wait a tick for state update
  await page.waitForTimeout(50);
  const stroke = await band.getAttribute('stroke');
  // Hover stroke is LAYOUT.sampleViewFragHoverColor = #FFFF00
  expect(stroke?.toUpperCase()).toBe('#FFFF00');
});
```

- [ ] **Step 4: Run new tests**

```bash
cd /Users/shawn/code/gel/ts
npx playwright test tests/visual/gelview.spec.ts --project=chromium-webgpu 2>&1 | tail -10
```

Expected: 3 pass.

- [ ] **Step 5: Run the full Playwright suite**

```bash
cd /Users/shawn/code/gel/ts
npx playwright test 2>&1 | tail -20
```

Expected: 30/30 per backend = 60 total. If existing `gel-page.spec.ts` tests fail because they queried `circle[data-testid="microtube-0"]` (SVG-based), update those locators to use the new HTML button:
```ts
page.getByTestId('microtube-0')
```
(`getByTestId` is element-agnostic — should already work; the failures more likely come from `circle` selectors or attribute checks like `cx`/`cy`. Adjust those to the new structure or remove them if they were testing the SVG geometry rather than behavior.)

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/routes/GelPage.tsx tests/visual/
git commit -m "feat(gel-page): mount SettingsButton in left panel; gelview Playwright tests"
```

---

## Task 6: Mark M13 done + tag

- [ ] **Step 1: Update plan checkboxes**

Edit `/Users/shawn/code/gel/docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md`. Change the M13/M14 lines:
```
- [ ] **M13 GelView pixel parity** — TBD — next-execute
- [ ] **M14 GelSettingsView** — TBD
```
to:
```
- [x] **M13 GelView pixel parity** — `2026-05-01-gelbox-ts-m13-gelview.md`
- [ ] **M14 GelSettingsView** — TBD — next-execute
```

- [ ] **Step 2: Commit + tag + push**

```bash
cd /Users/shawn/code/gel
git add docs/superpowers/plans/
git commit -m "docs(plan): mark M13 GelView pixel parity complete"
git tag m13-gelview
git push && git push --tags
```

---

## Notes for the implementer

**Why we don't replace `InspectorPlaceholder` here:** That's M14's job. M13 just adds the `inspectorMode` slice + the gear that toggles it. M14 reads it to swap inspector content.

**Why hover stroke is yellow `#FFFF00` and select is black `#000000`:** Direct from `Layout.h` lines 91–93. Same as the C++ — distinct from your usual web hover-blue convention because the gel background is dark, and these colors read clearly against the band colors.

**Why MicrotubeRow rewrite uses HTML buttons not SVG:** SVG circles don't naturally take rounded backgrounds with PNG insets, can't be tab-focused for accessibility, and don't respond to native pointer-cursor styling as cleanly. HTML+CSS is the right web idiom for what's basically a row of clickable cells with images inside.

**`@2x` icons in `<img>` srcs:** The `resolveAssetUrl` helper auto-swaps to the `@2x` variant at DPR ≥ 2. Always pass the `1x` URL to it. Don't write `@2x.png` in component code.

**If `band-0` testid is missing from the rollover test:** The existing `GelOverlay` should already render `data-testid="band-N"` (verified in M6). If it doesn't, the test will fail on `toBeAttached`; in that case adjust the selector to `.locator('rect[data-lane-index="0"][data-fragment-index="0"]')`.
