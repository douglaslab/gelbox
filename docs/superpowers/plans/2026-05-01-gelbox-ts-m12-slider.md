# M12 — Slider Primitive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the C++ `Slider` (data) + `SliderView` (rendering) widget pair (`/Users/shawn/code/gelbox/src/Slider.cpp` 669 lines, `src/SliderView.cpp` 152 lines) to a TypeScript data model + React component. Three styles (`slider`, `bar`, `graph`); two flanking PNG icons (lo/hi) that highlight on hover; optional notches with three snap modes (`drawOnly`, `nearest`, `snap`); optional value quantization; mapped value-to-string formatter for the inline label. This is the foundation widget every Phase 2 inspector panel will use.

**Architecture:** A pure data module `lib/slider/slider.ts` holds value mapping (normalized 0..1 ↔ mapped scalar), quantization, and nearest-notch helpers. A pure-HTML-and-CSS React component `components/primitives/SliderView.tsx` renders the slider. SVG is avoided in favor of positioned `<div>`/`<img>` elements so layout integrates with the rest of the chrome and is easy to debug in DevTools. The component is **controlled** (caller owns the value via `value` prop and `onChange` callback) — this matches React idioms and lets the existing reducer drive slider state without an internal `useState`.

**Tech Stack:** Existing Phase 1/2 stack. No new deps.

---

## File structure

```
ts/
  src/
    lib/
      slider/
        slider.ts                # CREATE — pure data + helpers
    components/
      primitives/
        SliderView.tsx           # CREATE — React component (3 styles, drag, snap)
        SliderView.module.css    # CREATE — track, handle, bar, graph, label, icon styles
    routes/
      DevSliderPage.tsx          # CREATE — manual demo at /#/dev/slider with all 3 styles
    App.tsx                      # MODIFY — register /dev/slider route
  tests/
    unit/
      slider.test.ts             # CREATE — pure-data helpers
    visual/
      slider.spec.ts             # CREATE — smoke Playwright on /#/dev/slider
docs/
  superpowers/
    plans/
      2026-05-01-gelbox-ts-m12-slider.md            # this file
      2026-05-01-gelbox-ts-phase-2-overview.md      # update at end
```

---

## Task 1: Slider data model

**Files:**
- Create: `ts/src/lib/slider/slider.ts`
- Create: `ts/tests/unit/slider.test.ts`

The module exports:
- `SliderStyle = 'slider' | 'bar' | 'graph'`
- `NotchAction = 'none' | 'drawOnly' | 'nearest' | 'snap'`
- `SliderConfig` interface (every field a slider needs to render or interact)
- Helpers: `lmap`, `clamp`, `quantize`, `calcNormalizedValue`, `getMappedValue`, `getNearestNotch`, `applyNotchSnap`

**Reference for math:** `Slider.cpp` lines 381–400 (mapping, quantization), 439–469 (nearest notch, snap distance).

- [ ] **Step 1: Write the failing tests**

Create `ts/tests/unit/slider.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  lmap,
  clamp,
  quantize,
  calcNormalizedValue,
  getMappedValue,
  getNearestNotch,
  applyNotchSnap,
} from '../../src/lib/slider/slider';

describe('lmap', () => {
  it('linearly maps from one range to another', () => {
    expect(lmap(0,    0, 100, -1, 1)).toBe(-1);
    expect(lmap(50,   0, 100, -1, 1)).toBe(0);
    expect(lmap(100,  0, 100, -1, 1)).toBe(1);
  });

  it('handles inverse ranges (out-min > out-max)', () => {
    expect(lmap(0.5, 0, 1, 100, 0)).toBe(50);
  });
});

describe('clamp', () => {
  it('clamps to range', () => {
    expect(clamp(-1,  0, 10)).toBe(0);
    expect(clamp(5,   0, 10)).toBe(5);
    expect(clamp(100, 0, 10)).toBe(10);
  });
});

describe('quantize', () => {
  it('returns input unchanged when step <= 0', () => {
    expect(quantize(3.7, 0)).toBe(3.7);
    expect(quantize(3.7, -1)).toBe(3.7);
  });

  it('rounds to nearest multiple of step', () => {
    expect(quantize(3.7, 1)).toBe(4);
    expect(quantize(3.4, 1)).toBe(3);
    expect(quantize(125,  100)).toBe(100);
    expect(quantize(175,  100)).toBe(200);
  });
});

describe('calcNormalizedValue / getMappedValue (round-trip)', () => {
  const cfg = { valueMin: 100, valueMax: 1000, quantize: 0 };

  it('normalized 0 maps to valueMin', () => {
    expect(getMappedValue(0, cfg)).toBe(100);
  });

  it('normalized 1 maps to valueMax', () => {
    expect(getMappedValue(1, cfg)).toBe(1000);
  });

  it('mapped 550 corresponds to normalized 0.5', () => {
    expect(calcNormalizedValue(550, cfg)).toBeCloseTo(0.5, 6);
  });

  it('quantization clamps the mapped value to a step grid', () => {
    const q = { valueMin: 0, valueMax: 1000, quantize: 100 };
    expect(getMappedValue(0.43, q)).toBe(400);
    expect(getMappedValue(0.47, q)).toBe(500);
  });

  it('mapped value never escapes valueMin/valueMax even when normalized > 1', () => {
    expect(getMappedValue(1.2, cfg)).toBe(1000);
    expect(getMappedValue(-0.3, cfg)).toBe(100);
  });
});

describe('getNearestNotch', () => {
  it('returns the closest notch (Slider.cpp:439)', () => {
    const notches = [0, 0.25, 0.5, 0.75, 1];
    expect(getNearestNotch(0.30, notches)).toBe(0.25);
    expect(getNearestNotch(0.40, notches)).toBe(0.5);
    expect(getNearestNotch(0.99, notches)).toBe(1);
  });

  it('returns input when notches is empty', () => {
    expect(getNearestNotch(0.7, [])).toBe(0.7);
  });
});

describe('applyNotchSnap', () => {
  const notches = [0, 0.5, 1];

  it('returns input when action is none/drawOnly', () => {
    expect(applyNotchSnap(0.45, notches, 'none',     0.05)).toBe(0.45);
    expect(applyNotchSnap(0.45, notches, 'drawOnly', 0.05)).toBe(0.45);
  });

  it('always snaps to nearest when action is nearest', () => {
    expect(applyNotchSnap(0.10, notches, 'nearest', 0.05)).toBe(0);
    expect(applyNotchSnap(0.45, notches, 'nearest', 0.05)).toBe(0.5);
    expect(applyNotchSnap(0.90, notches, 'nearest', 0.05)).toBe(1);
  });

  it('snaps only within snapDist for action=snap', () => {
    // 0.48 is within 0.05 of 0.5 → snap to 0.5
    expect(applyNotchSnap(0.48, notches, 'snap', 0.05)).toBe(0.5);
    // 0.30 is NOT within 0.05 of any notch → keep input
    expect(applyNotchSnap(0.30, notches, 'snap', 0.05)).toBe(0.30);
  });
});
```

- [ ] **Step 2: Run tests, verify failure**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/slider.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Write `slider.ts`**

Create `ts/src/lib/slider/slider.ts`:

```ts
export type SliderStyle = 'slider' | 'bar' | 'graph';
export type NotchAction = 'none' | 'drawOnly' | 'nearest' | 'snap';

export interface SliderConfig {
  /** Visual style — see SliderStyle above. */
  style: SliderStyle;
  /** Mapped-value range. The slider's normalized 0..1 lerps between these. */
  valueMin: number;
  valueMax: number;
  /** If > 0, the mapped value is rounded to multiples of this step. */
  quantize: number;
  /** Optional snap targets in normalized 0..1 coords. */
  notches?: number[];
  /** How notches affect drag — see NotchAction. Default: 'none'. */
  notchAction?: NotchAction;
  /** For action='snap', drag must come within this normalized distance to snap. */
  notchSnapDist?: number;
  /** Optional formatter for the inline value label. */
  formatValue?: (mappedValue: number) => string;
  /** Whether the slider responds to input. Disabled sliders render dimmer. */
  enabled?: boolean;
}

/* ---------- pure helpers (mirror Slider.cpp utilities) ---------- */

export function lmap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMin === inMax) return outMin;
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

export function clamp(v: number, lo: number, hi: number): number {
  if (lo > hi) [lo, hi] = [hi, lo];
  return Math.max(lo, Math.min(hi, v));
}

/** Round v to nearest multiple of step. step <= 0 means no quantization. */
export function quantize(v: number, step: number): number {
  if (step <= 0) return v;
  return Math.round(v / step) * step;
}

/** Mapped value -> normalized 0..1 (mirrors Slider::calcNormalizedValue). */
export function calcNormalizedValue(mapped: number, cfg: Pick<SliderConfig, 'valueMin' | 'valueMax'>): number {
  return lmap(mapped, cfg.valueMin, cfg.valueMax, 0, 1);
}

/**
 * Normalized 0..1 -> mapped value (mirrors Slider::getMappedValue).
 * Quantizes after mapping then clamps to [valueMin, valueMax].
 */
export function getMappedValue(normalized: number, cfg: Pick<SliderConfig, 'valueMin' | 'valueMax' | 'quantize'>): number {
  let v = lmap(normalized, 0, 1, cfg.valueMin, cfg.valueMax);
  v = quantize(v, cfg.quantize);
  v = clamp(v, cfg.valueMin, cfg.valueMax);
  return v;
}

/** Returns the notch closest to v in absolute distance. Returns v if notches empty. */
export function getNearestNotch(v: number, notches: number[]): number {
  if (notches.length === 0) return v;
  let bestNotch = notches[0];
  let bestDist  = Math.abs(notches[0] - v);
  for (let i = 1; i < notches.length; i++) {
    const d = Math.abs(notches[i] - v);
    if (d < bestDist) {
      bestDist = d;
      bestNotch = notches[i];
    }
  }
  return bestNotch;
}

/**
 * Apply notch snapping to a normalized 0..1 value per the action mode.
 * - `none` / `drawOnly`: returns input unchanged.
 * - `nearest`: always snaps to the closest notch.
 * - `snap`: snaps to closest notch only if within snapDist of it.
 */
export function applyNotchSnap(
  v: number,
  notches: number[],
  action: NotchAction,
  snapDist: number,
): number {
  if (action === 'none' || action === 'drawOnly' || notches.length === 0) return v;
  const nearest = getNearestNotch(v, notches);
  if (action === 'nearest') return nearest;
  // action === 'snap'
  return Math.abs(nearest - v) <= snapDist ? nearest : v;
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
cd /Users/shawn/code/gel/ts && npx vitest run tests/unit/slider.test.ts
```

Expected: PASS, 18 tests (5 describe groups × multiple `it`s; count varies — 19 actual based on the spec above).

- [ ] **Step 5: Run full unit suite**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

Expected: 169 + 19 = 188 passing.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/lib/slider/slider.ts tests/unit/slider.test.ts
git commit -m "feat(slider): data model + value/quantize/notch helpers (port of Slider.cpp)"
```

---

## Task 2: SliderView component

**Files:**
- Create: `ts/src/components/primitives/SliderView.tsx`
- Create: `ts/src/components/primitives/SliderView.module.css`

**Reference:** `Slider.cpp` lines 124–215 (`Slider::draw`), 217–290 (`drawGraph`), 292–345 (`drawTextLabel`), 347–379 (`drawNotches`); `SliderView.cpp` (mouse interaction).

The component is **controlled**: caller passes `value` (mapped) and `onChange` (called with new mapped value). For the `graph` style, caller passes `graphValues: number[]` (each 0..1) and `onGraphChange`.

Visual layout (`slider` style at default 217×26 box from `Layout::mFragViewSlidersWidth`):
```
[icon-lo] ──────●─────────────── [icon-hi]
              ↑ handle (16×20)
                     420 bp        ← inline label
```

For `bar` style:
```
[icon] ▰▰▰▰▰▰░░░░░░░ "100"  [icon]
       ↑ rounded fill from left
```

For `graph` style:
```
[icon]  ┃ ▆▆ ▆ ▃ ▃ ▁ ▁ ▁  [icon]
        ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
```

- [ ] **Step 1: Create the CSS module**

Create `ts/src/components/primitives/SliderView.module.css`:

```css
.root {
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 12px;
  color: #777777;            /* LAYOUT.uiFontColor */
}

.icon {
  display: block;
  flex: 0 0 auto;
  pointer-events: auto;
}

.icon[data-highlighted="true"] {
  filter: brightness(0.7);
}

.disabled .icon {
  filter: grayscale(1) opacity(0.5);
}

/* Slider style: line + handle */
.track {
  position: relative;
  flex: 1 1 auto;
  height: 20px;              /* match handle height for vertical alignment */
}

.line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #979797;       /* LAYOUT.sliderLineColor */
  transform: translateY(-0.5px);
}

.disabled .line {
  background: #C7C7C7;
}

.handle {
  position: absolute;
  width: 16px;               /* LAYOUT.sliderHandleSize.x */
  height: 20px;              /* LAYOUT.sliderHandleSize.y */
  background: #4990E2;       /* LAYOUT.sliderHandleColor */
  border-radius: 4px;
  top: 0;
  cursor: grab;
  box-shadow: 0 3px 4px rgba(0,0,0,0.15);
}

.handle:active { cursor: grabbing; }

.disabled .handle {
  background: #A4C8F0;
  cursor: default;
  box-shadow: none;
}

/* Bar style */
.bar {
  position: relative;
  flex: 1 1 auto;
  height: 23px;              /* LAYOUT.bufferViewSliderBarSize.y */
  border-radius: 4px;        /* LAYOUT.bufferViewSliderCornerRadius */
  background: #E8EBF1;       /* LAYOUT.bufferViewSliderEmptyColor */
  overflow: hidden;
  cursor: pointer;
}

.barFill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #AEB6C3;       /* LAYOUT.bufferViewSliderFillColor */
  border-radius: inherit;
}

.barLabel {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #333333;            /* LAYOUT.bufferViewSliderTextValueColor */
  pointer-events: none;
  white-space: nowrap;
}

.disabled .bar {
  cursor: default;
  opacity: 0.5;
}

/* Graph style */
.graph {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  align-items: flex-end;
  gap: 0;
  height: 32px;              /* LAYOUT.fragViewSlidersGraphHeight */
}

.graphCol {
  flex: 1 1 0;
  background: #4990E2;
  margin: 0 1px;
  min-height: 1px;
  cursor: ns-resize;
}

.graphCap {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: #E5E5FF;
  pointer-events: none;
}

/* Notch dots (slider style only) */
.notch {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(151, 151, 151, 0.5);  /* sliderLineColor at 50% */
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* Slider label (below the line, centered on the handle) */
.sliderLabel {
  position: absolute;
  top: 22px;
  font-size: 12px;
  color: #777777;
  pointer-events: none;
  white-space: nowrap;
  transform: translateX(-50%);
}
```

- [ ] **Step 2: Create the component**

Create `ts/src/components/primitives/SliderView.tsx`:

```tsx
import { useCallback, useRef, type CSSProperties } from 'react';
import {
  type SliderConfig,
  applyNotchSnap,
  calcNormalizedValue,
  getMappedValue,
} from '../../lib/slider/slider';
import { resolveAssetUrl } from '../../lib/layout/assets';
import styles from './SliderView.module.css';

export interface SliderViewProps {
  config: SliderConfig;
  /** Current mapped value (e.g., 420 for "420 bp"). */
  value: number;
  /** Called when the user changes the value. */
  onChange: (mappedValue: number) => void;
  /** PNG asset URL for the lo (left) icon. Optional. */
  iconLo?: string;
  /** PNG asset URL for the hi (right) icon. Optional. */
  iconHi?: string;
  /** Notional icon size — width × height in CSS pixels. */
  iconSize?: { x: number; y: number };
  /** Gutter between icon and the bar/track. */
  iconGutter?: number;
  /** Total component width in px. */
  width?: number;
  /** For style='graph' only: the column heights, each 0..1. */
  graphValues?: number[];
  onGraphChange?: (values: number[]) => void;
  /** Optional inline style override. */
  style?: CSSProperties;
  /** Optional data-testid. */
  testId?: string;
}

const DEFAULT_ICON_SIZE   = { x: 26, y: 26 };
const DEFAULT_ICON_GUTTER = 16;
const DEFAULT_WIDTH       = 217;
const DEFAULT_SNAP_DIST   = 0.04;

/**
 * Three-style slider widget. Mirrors C++ `Slider` + `SliderView`.
 *
 * Styles:
 *   - 'slider': horizontal line + draggable handle + inline label below
 *   - 'bar':    rounded fill bar + inline label inside fill
 *   - 'graph':  column histogram of `graphValues`
 */
export function SliderView({
  config,
  value,
  onChange,
  iconLo,
  iconHi,
  iconSize   = DEFAULT_ICON_SIZE,
  iconGutter = DEFAULT_ICON_GUTTER,
  width      = DEFAULT_WIDTH,
  graphValues,
  onGraphChange,
  style,
  testId,
}: SliderViewProps) {
  const enabled = config.enabled !== false;
  const trackRef = useRef<HTMLDivElement | null>(null);

  const normalized = calcNormalizedValue(value, config);

  // Convert pointer-x within the track into a new mapped value.
  const valueAtPointer = useCallback((pointerX: number): number => {
    if (!trackRef.current) return value;
    const r = trackRef.current.getBoundingClientRect();
    const t = (pointerX - r.left) / r.width;
    const clamped = Math.max(0, Math.min(1, t));
    const snapped = applyNotchSnap(
      clamped,
      config.notches ?? [],
      config.notchAction ?? 'none',
      config.notchSnapDist ?? DEFAULT_SNAP_DIST,
    );
    return getMappedValue(snapped, config);
  }, [config, value]);

  function onPointerDownTrack(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    onChange(valueAtPointer(e.clientX));
  }

  function onPointerMoveTrack(e: React.PointerEvent<HTMLDivElement>) {
    if (!enabled) return;
    if (e.buttons !== 1) return;        // only when dragging
    e.preventDefault();
    onChange(valueAtPointer(e.clientX));
  }

  function onIconClick(which: 'lo' | 'hi') {
    if (!enabled) return;
    onChange(which === 'lo' ? config.valueMin : config.valueMax);
  }

  // Graph drag — vertical drag on a column updates that column's value.
  function onGraphPointerDown(idx: number) {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || !graphValues || !onGraphChange) return;
      e.preventDefault();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      const trackHeight = target.parentElement!.getBoundingClientRect().height;

      function update(clientY: number) {
        const r = target.parentElement!.getBoundingClientRect();
        const yFromBottom = r.bottom - clientY;
        const v = Math.max(0, Math.min(1, yFromBottom / trackHeight));
        const next = graphValues!.slice();
        next[idx] = v;
        onGraphChange!(next);
      }

      update(e.clientY);

      const move = (ev: PointerEvent) => update(ev.clientY);
      const up = () => {
        target.releasePointerCapture(e.pointerId);
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
      };
      target.addEventListener('pointermove', move);
      target.addEventListener('pointerup', up);
    };
  }

  const labelStr = config.formatValue?.(value);

  return (
    <div
      className={`${styles.root} ${enabled ? '' : styles.disabled}`}
      style={{ width, ...style }}
      data-testid={testId}
    >
      {iconLo && (
        <img
          src={resolveAssetUrl(iconLo)}
          alt=""
          width={iconSize.x}
          height={iconSize.y}
          className={styles.icon}
          onClick={() => onIconClick('lo')}
          data-testid={testId ? `${testId}-icon-lo` : undefined}
        />
      )}

      {iconLo && <div style={{ width: iconGutter, flex: '0 0 auto' }} />}

      {config.style === 'slider' && (
        <div
          ref={trackRef}
          className={styles.track}
          onPointerDown={onPointerDownTrack}
          onPointerMove={onPointerMoveTrack}
          data-testid={testId ? `${testId}-track` : undefined}
        >
          <div className={styles.line} />
          {(config.notches ?? []).map((n, i) => (
            <div key={i} className={styles.notch} style={{ left: `${n * 100}%` }} />
          ))}
          <div
            className={styles.handle}
            style={{ left: `calc(${normalized * 100}% - 8px)` }}
            data-testid={testId ? `${testId}-handle` : undefined}
          />
          {labelStr && (
            <div className={styles.sliderLabel} style={{ left: `${normalized * 100}%` }}>
              {labelStr}
            </div>
          )}
        </div>
      )}

      {config.style === 'bar' && (
        <div
          ref={trackRef}
          className={styles.bar}
          onPointerDown={onPointerDownTrack}
          onPointerMove={onPointerMoveTrack}
          data-testid={testId ? `${testId}-track` : undefined}
        >
          <div className={styles.barFill} style={{ width: `${normalized * 100}%` }} />
          {labelStr && (
            <div
              className={styles.barLabel}
              style={
                normalized > 0.5
                  ? { right: `calc(${(1 - normalized) * 100}% + 8px)` }
                  : { left:  `calc(${normalized * 100}% + 8px)` }
              }
            >
              {labelStr}
            </div>
          )}
        </div>
      )}

      {config.style === 'graph' && graphValues && (
        <div className={styles.graph}>
          <div className={styles.graphCap} />
          {graphValues.map((v, i) => (
            <div
              key={i}
              className={styles.graphCol}
              style={{ height: `${Math.max(1, v * 100)}%` }}
              onPointerDown={onGraphPointerDown(i)}
              data-testid={testId ? `${testId}-col-${i}` : undefined}
            />
          ))}
        </div>
      )}

      {iconHi && <div style={{ width: iconGutter, flex: '0 0 auto' }} />}

      {iconHi && (
        <img
          src={resolveAssetUrl(iconHi)}
          alt=""
          width={iconSize.x}
          height={iconSize.y}
          className={styles.icon}
          onClick={() => onIconClick('hi')}
          data-testid={testId ? `${testId}-icon-hi` : undefined}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/shawn/code/gel/ts && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add src/components/primitives/SliderView.tsx src/components/primitives/SliderView.module.css
git commit -m "feat(slider): SliderView component (3 styles, drag, click-to-set, icon-tap-limit)"
```

---

## Task 3: Demo route at `/#/dev/slider`

**Files:**
- Create: `ts/src/routes/DevSliderPage.tsx`
- Modify: `ts/src/App.tsx` (or wherever routes are registered)

A simple demo route that renders one of each style with sensible defaults so we can eyeball it and Playwright can snapshot it.

- [ ] **Step 1: Read the existing route registration**

```bash
cd /Users/shawn/code/gel/ts && cat src/App.tsx
```

Note where routes are registered.

- [ ] **Step 2: Create the demo page**

Create `ts/src/routes/DevSliderPage.tsx`:

```tsx
import { useState } from 'react';
import { SliderView } from '../components/primitives/SliderView';

export function DevSliderPage() {
  const [voltage,  setVoltage ] = useState(70);   // mapped: 30..170
  const [wellDmg,  setWellDmg ] = useState(0.3);  // mapped: 0..1 (bar)
  const [graph,    setGraph   ] = useState<number[]>([0.9, 0.6, 0.4, 0.25, 0.15, 0.1, 0.05, 0.05]);

  return (
    <main style={{ maxWidth: 800, margin: '24px auto', padding: 16, fontFamily: 'Inter' }}>
      <h1>Slider primitives</h1>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Slider style — Voltage</h2>
        <SliderView
          testId="slider-voltage"
          config={{
            style: 'slider',
            valueMin: 30,
            valueMax: 170,
            quantize: 10,
            notches: [0, 0.25, 0.5, 0.75, 1],
            notchAction: 'snap',
            formatValue: (v) => `${v} V`,
          }}
          value={voltage}
          onChange={setVoltage}
          iconLo="/assets/slider-icons/voltage-lo.png"
          iconHi="/assets/slider-icons/voltage-hi.png"
        />
      </section>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Bar style — Well damage</h2>
        <SliderView
          testId="slider-welldmg"
          config={{
            style: 'bar',
            valueMin: 0,
            valueMax: 1,
            quantize: 0,
            formatValue: (v) => v.toFixed(2),
          }}
          value={wellDmg}
          onChange={setWellDmg}
          iconLo="/assets/slider-icons/well-damage-lo.png"
          iconHi="/assets/slider-icons/well-damage-hi.png"
        />
      </section>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Graph style — Aggregate distribution</h2>
        <SliderView
          testId="slider-graph"
          config={{
            style: 'graph',
            valueMin: 0,
            valueMax: 1,
            quantize: 0,
          }}
          value={0}
          onChange={() => undefined}
          graphValues={graph}
          onGraphChange={setGraph}
          iconLo="/assets/slider-icons/multimer-lo.png"
          iconHi="/assets/slider-icons/multimer-hi.png"
          width={300}
        />
      </section>

      <section style={{ margin: '32px 0' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#000', margin: '0 0 8px' }}>Disabled slider</h2>
        <SliderView
          config={{
            style: 'slider',
            valueMin: 0,
            valueMax: 100,
            quantize: 0,
            enabled: false,
            formatValue: (v) => `${v}%`,
          }}
          value={50}
          onChange={() => undefined}
          iconLo="/assets/slider-icons/aspect-lo.png"
          iconHi="/assets/slider-icons/aspect-hi.png"
        />
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Register the route**

Edit `ts/src/App.tsx`. Find where other dev routes are registered (look for `/dev` paths). Add a route for `/dev/slider` pointing to `DevSliderPage`. Match the existing import + route style (the existing dev routes use `<Route path="dev" ...>` or similar — follow the existing pattern verbatim).

- [ ] **Step 4: Boot dev server, smoke**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run dev > /tmp/m12-vite.log 2>&1 &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/#/dev/slider
```

Expected: 200. Open in browser, confirm:
- Voltage slider with handle, drags smoothly, snaps to 25/50/75/100% notches when within 4% distance
- Bar slider with rounded fill, label moves left/right of fill at 50%
- Graph with 8 columns, drag a column up/down to change its height
- Disabled slider is dimmer and doesn't respond
- Each slider has the correct lo/hi PNG icons flanking it
- Clicking the lo icon sets value to min, clicking hi sets value to max

- [ ] **Step 5: Compile + commit**

```bash
cd /Users/shawn/code/gel/ts && npx tsc --noEmit
git add src/routes/DevSliderPage.tsx src/App.tsx
git commit -m "feat(dev): /#/dev/slider demo route exercising all three slider styles"
```

---

## Task 4: Smoke Playwright test

**Files:**
- Create: `ts/tests/visual/slider.spec.ts`

Verify the demo page mounts, all three sliders render, and clicking the lo/hi icons changes the displayed value.

- [ ] **Step 1: Write the test**

Create `ts/tests/visual/slider.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('Slider demo page mounts all three styles', async ({ page }) => {
  await page.goto('/#/dev/slider');

  await expect(page.getByTestId('slider-voltage')).toBeVisible();
  await expect(page.getByTestId('slider-welldmg')).toBeVisible();
  await expect(page.getByTestId('slider-graph')).toBeVisible();

  await expect(page.getByTestId('slider-voltage-handle')).toBeVisible();
  await expect(page.getByTestId('slider-voltage-icon-lo')).toBeVisible();
  await expect(page.getByTestId('slider-voltage-icon-hi')).toBeVisible();
});

test('Clicking the lo icon sets voltage slider to its minimum', async ({ page }) => {
  await page.goto('/#/dev/slider');

  await page.getByTestId('slider-voltage-icon-lo').click();
  // The label should now show 30 V (min of voltage range)
  await expect(page.getByTestId('slider-voltage')).toContainText('30 V');
});

test('Clicking the hi icon sets bar slider to its maximum', async ({ page }) => {
  await page.goto('/#/dev/slider');

  await page.getByTestId('slider-welldmg-icon-hi').click();
  await expect(page.getByTestId('slider-welldmg')).toContainText('1.00');
});
```

- [ ] **Step 2: Run the new test**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test tests/visual/slider.spec.ts --project=chromium-webgpu 2>&1 | tail -10
```

Expected: 3 tests pass. If a test fails because `containText` doesn't match (e.g., the label shows "30" not "30 V"), inspect the actual rendered text and adjust the assertion to match.

- [ ] **Step 3: Run full Playwright**

```bash
cd /Users/shawn/code/gel/ts && npx playwright test 2>&1 | tail -10
```

Expected: 27/27 per backend = 54 total.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel/ts
git add tests/visual/slider.spec.ts
git commit -m "test(slider): mount + icon-click Playwright smoke on /#/dev/slider"
```

---

## Task 5: Mark M12 done + tag

- [ ] **Step 1: Update plan checkbox**

Edit `/Users/shawn/code/gel/docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md`. Change:
```
- [ ] **M12 Slider primitives** — TBD — next-execute
```
to:
```
- [x] **M12 Slider primitives** — `2026-05-01-gelbox-ts-m12-slider.md`
```
and:
```
- [ ] **M13 GelView pixel parity** — TBD
```
to:
```
- [ ] **M13 GelView pixel parity** — TBD — next-execute
```

- [ ] **Step 2: Commit + tag + push**

```bash
cd /Users/shawn/code/gel
git add docs/superpowers/plans/2026-05-01-gelbox-ts-phase-2-overview.md docs/superpowers/plans/2026-05-01-gelbox-ts-m12-slider.md
git commit -m "docs(plan): mark M12 slider primitives complete"
git tag m12-slider
git push && git push --tags
```

---

## Notes for the implementer

**Why HTML+CSS instead of SVG:** Slider visuals are rectangles, lines, and rounded fills — no curves. HTML+CSS is faster to author, integrates naturally with the rest of the chrome, and gives DevTools access to every layer. SVG buys nothing here.

**Why controlled component:** The reducer is the single source of truth for sample state, gel state, etc. Sliders that own their own value would either drift from the reducer or need bidirectional sync. Controlled with `value` + `onChange` is the React idiom and avoids that whole class of bugs.

**Why graph drag is local (target.addEventListener) not React's onPointerMove:** React's onPointerMove only fires while the pointer is over the element; the user can drag outside the column while still holding the button. Capturing the pointer + listening on the column element directly handles drag continuity correctly.

**Why no separate `flipXAxis()`:** The C++ `Slider::flipXAxis()` is used in only one place (gel rotate slider). When we hit M14 and need that slider, we'll either bake the flip into the icon-asset choice (swap which is lo vs hi) or add a `reverse?: boolean` config flag. Defer until needed.

**`barLabel` positioning math:** When `normalized > 0.5`, the label should sit to the LEFT of the fill edge (right-aligned to the boundary). When `<= 0.5`, the label sits to the RIGHT of the fill edge. The C++ code does this via `if ( mValue > .5f ) baseline.x -= measureString.x` — same logic, expressed as CSS `left` vs `right` with an 8px gutter (matches `kGutter(8.f, 8.f)` in `Slider::drawTextLabel`).

**Notch action `drawOnly` vs `none`:** `drawOnly` means "draw the dots, but don't snap"; `none` means "no dots, no snap". The visual layer reads `notches` and `notchAction === 'none'` — when action is `none`, skip rendering dots; otherwise render them. The snap logic in `applyNotchSnap` already returns input unchanged for both `none` and `drawOnly`.
