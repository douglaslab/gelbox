# M7 — Loupes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cmd-click on a band creates a persistent loupe popover near the click point, showing the fragment's metadata (bp, mass, dye, color) and a simple SVG particle-scatter visualization tinted with the fragment's color. Multiple loupes can be open. Each has a close (×) button. **Scope cut:** the WebGPU/WebGL2 toon-shader pipeline + Brownian-motion molecular sim from the original M7 acceptance is deferred to **M7b** as a follow-up. The minimum-viable loupe UI ships in M7.

**Architecture:** Loupes live in `gelState` as `loupes: LoupeRef[]` where each ref is `{ id, lane, fragmentIndex, x, y }`. Cmd-click on a band rect dispatches `ADD_LOUPE`. A new portal layer in GelPage renders one `<Loupe>` per ref absolutely-positioned at the click coords. Each Loupe is a small SVG card (180×120) with the fragment's metadata + a particle-scatter visualization (8–20 random circles colored from the fragment's `color`). Close button dispatches `REMOVE_LOUPE`.

**Tech Stack:** Same as M6/M6b/M8. No new deps.

**M7 reference:** C++ source at `~/code/gelbox/src/GelView.cpp:426` (cmd-click loupe creation), `~/code/gelbox/include/SampleView.h` (loupe view structure), `~/code/gelbox/src/MolecularSim.cpp` (deferred — toon-shader particle sim).

---

## Scope

**In M7:**
- `ts/src/lib/gel/gelState.ts` — add `loupes: LoupeRef[]`, `ADD_LOUPE`, `REMOVE_LOUPE` actions.
- `ts/src/components/gel/Loupe.tsx` — single loupe popover component.
- `ts/src/components/gel/LoupePortalLayer.tsx` — renders all loupes from state.
- `ts/src/components/gel/GelOverlay.tsx` — cmd-click handler that dispatches `ADD_LOUPE`.
- `ts/src/routes/GelPage.tsx` — mount LoupePortalLayer.
- `ts/tests/unit/gelState.test.ts` — extend with loupe action tests.
- `ts/tests/visual/gel-page.spec.ts` — append cmd-click loupe test + close button test.
- Phase 1 overview: M7 row linked, tagged `m7-loupes`, CI green.

**Out of M7 (deferred to M7b):**
- WebGPU/WebGL2 toon-shader pipeline.
- Brownian-motion particle simulation.
- Hover-on-loupes (transient loupe that follows the cursor).
- Loupe drag-to-reposition.
- Persistent storage of loupes across reloads.

**Non-goals:**
- 3D rendering inside loupes.
- Multiple selection of bands at once into a single loupe.

---

## Decisions for this milestone

| Decision | Reason |
|---|---|
| SVG-based particle scatter, NOT a separate WebGPU pipeline | Tractable autonomously; defers the heavy toon-shader work to M7b |
| Particle count proportional to fragment.mass clamped [8, 30] | Visual hint at fragment density without a real sim |
| Particle positions derived from a deterministic mulberry32(randSeed) | Reproducible across renders |
| Loupes positioned at click coordinates (relative to viewport) | Simple math; user-comprehensible |
| Loupes are absolute-positioned over the entire page | Allows them to sit above any UI element including controls |
| Each loupe has a unique id (incrementing counter in state) | Stable React key + dispatch target |
| Cmd-click only (Meta on macOS, Ctrl on Windows mapped to meta in modifier state) | Matches C++; simpler than dual key handling |
| Close button is an SVG `<text>` "×" — no separate icon component | Minimal markup |
| If the same fragment is clicked twice, two loupes open | Matches C++ behavior (each loupe is independent) |

---

## File structure for M7

```
ts/
  src/
    lib/
      gel/
        gelState.ts                          # MODIFY: add loupes + actions
    components/
      gel/
        GelOverlay.tsx                       # MODIFY: cmd-click handler
        Loupe.tsx                            # NEW
        LoupePortalLayer.tsx                 # NEW
    routes/
      GelPage.tsx                            # MODIFY: mount LoupePortalLayer
  tests/
    unit/
      gelState.test.ts                       # EXTEND: loupe action tests
    visual/
      gel-page.spec.ts                       # EXTEND: loupe spec
docs/
  superpowers/
    plans/
      2026-04-27-gelbox-ts-phase-1-overview.md  # MODIFY: M7 row
      2026-04-30-gelbox-ts-m7-loupes.md         # this file
```

---

## Tasks

### Task 1: Add loupes to GelState

**Files:**
- Modify: `ts/src/lib/gel/gelState.ts`
- Modify: `ts/tests/unit/gelState.test.ts`

- [ ] **Step 1: Add `LoupeRef` interface + state field + actions to `ts/src/lib/gel/gelState.ts`**

Add this interface near `DragState`:

```ts
export interface LoupeRef {
  id:            number;
  lane:          number;
  fragmentIndex: number;
  x:             number;   // viewport-page x in CSS px
  y:             number;   // viewport-page y in CSS px
}
```

Add to `GelState` (place after `wellRects`):

```ts
  loupes:                LoupeRef[];
  loupeNextId:           number;
```

Add to the `Action` union:

```ts
  | { type: 'ADD_LOUPE';     lane: number; fragmentIndex: number; x: number; y: number }
  | { type: 'REMOVE_LOUPE';  id: number }
  | { type: 'CLEAR_LOUPES' }
```

Add to `initialGelState()` return object:

```ts
    loupes: [],
    loupeNextId: 1,
```

Add three new cases to the reducer switch:

```ts
    case 'ADD_LOUPE': {
      const sample = state.samples[action.lane];
      if (!sample || !sample.fragments[action.fragmentIndex]) return state;
      const id = state.loupeNextId;
      return {
        ...state,
        loupes: [...state.loupes, { id, lane: action.lane, fragmentIndex: action.fragmentIndex, x: action.x, y: action.y }],
        loupeNextId: id + 1,
      };
    }
    case 'REMOVE_LOUPE':
      return { ...state, loupes: state.loupes.filter((l) => l.id !== action.id) };
    case 'CLEAR_LOUPES':
      return { ...state, loupes: [], loupeNextId: 1 };
```

- [ ] **Step 2: Append loupe tests to `ts/tests/unit/gelState.test.ts`**

Inside the existing `describe('gelReducer (multi-lane)', ...)` block:

```ts
  it('ADD_LOUPE appends a loupe with auto-incrementing id', () => {
    const next1 = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 0, x: 100, y: 200 });
    expect(next1.loupes.length).toBe(1);
    expect(next1.loupes[0].id).toBe(1);
    expect(next1.loupes[0].lane).toBe(0);
    expect(next1.loupes[0].fragmentIndex).toBe(0);
    expect(next1.loupes[0].x).toBe(100);
    expect(next1.loupes[0].y).toBe(200);
    expect(next1.loupeNextId).toBe(2);
    const next2 = gelReducer(next1, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 1, x: 50, y: 60 });
    expect(next2.loupes.length).toBe(2);
    expect(next2.loupes[1].id).toBe(2);
  });
  it('ADD_LOUPE on empty lane is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 1, fragmentIndex: 0, x: 100, y: 200 });
    expect(next.loupes.length).toBe(0);
  });
  it('ADD_LOUPE on out-of-range fragment is a no-op', () => {
    const next = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 999, x: 100, y: 200 });
    expect(next.loupes.length).toBe(0);
  });
  it('REMOVE_LOUPE removes by id', () => {
    const a = gelReducer(STARTING,    { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 0, x: 1, y: 1 });
    const b = gelReducer(a,           { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 1, x: 2, y: 2 });
    expect(b.loupes.length).toBe(2);
    const removed = gelReducer(b, { type: 'REMOVE_LOUPE', id: 1 });
    expect(removed.loupes.length).toBe(1);
    expect(removed.loupes[0].id).toBe(2);
  });
  it('CLEAR_LOUPES empties the array and resets id counter', () => {
    const a = gelReducer(STARTING, { type: 'ADD_LOUPE', lane: 0, fragmentIndex: 0, x: 1, y: 1 });
    const cleared = gelReducer(a, { type: 'CLEAR_LOUPES' });
    expect(cleared.loupes.length).toBe(0);
    expect(cleared.loupeNextId).toBe(1);
  });
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 141 + 5 = 146/146 unit.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/src/lib/gel/gelState.ts ts/tests/unit/gelState.test.ts
git commit -m "feat(gel): add loupes slice + ADD_LOUPE/REMOVE_LOUPE/CLEAR_LOUPES actions"
```

---

### Task 2: Loupe component + LoupePortalLayer

**Files:**
- Create: `ts/src/components/gel/Loupe.tsx`
- Create: `ts/src/components/gel/LoupePortalLayer.tsx`

- [ ] **Step 1: Write `ts/src/components/gel/Loupe.tsx`**

```tsx
import { useGelDispatch } from './GelContext';
import type { LoupeRef } from '../../lib/gel/gelState';
import type { Fragment } from '../../lib/sim/sample';
import { mulberry32 } from '../../lib/sim/rng';

interface LoupeProps {
  loupe:    LoupeRef;
  fragment: Fragment;
}

const W = 180;
const H = 120;

export function Loupe({ loupe, fragment }: LoupeProps) {
  const dispatch = useGelDispatch();

  // Particle count proportional to mass, clamped [8, 30]
  const count = Math.max(8, Math.min(30, Math.round(fragment.mass * 0.2)));
  const rng = mulberry32(loupe.id * 1009 + fragment.bases);
  const particles = Array.from({ length: count }, () => ({
    x: rng() * (W - 24) + 12,
    y: rng() * (H - 56) + 32,
    r: 2 + rng() * 4,
  }));

  // Color: dye gets its own; fragment uses focusColor heuristic (we use frag.color)
  const [r, g, b] = fragment.color;
  const fill = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  const dyeName = fragment.dye >= 0
    ? ['Xylene', 'Cresol', 'Bromphenol', 'Orange G'][fragment.dye] ?? 'Dye'
    : null;

  return (
    <div
      data-testid={`loupe-${loupe.id}`}
      data-loupe-id={loupe.id}
      style={{
        position: 'fixed',
        left: loupe.x,
        top: loupe.y,
        width: W,
        height: H,
        background: 'var(--color-surface-raised, #14131a)',
        border: '1px solid var(--color-grid, #444)',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <button
        data-testid={`loupe-close-${loupe.id}`}
        onClick={() => dispatch({ type: 'REMOVE_LOUPE', id: loupe.id })}
        style={{
          position: 'absolute', top: 4, right: 4,
          width: 22, height: 22, padding: 0,
          background: 'transparent', border: 'none',
          color: 'var(--color-ink-muted, #888)', cursor: 'pointer',
          fontSize: 16, lineHeight: '20px',
        }}
        aria-label="Close loupe"
      >×</button>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W} height={H}
        style={{ display: 'block', position: 'absolute', inset: 0 }}
      >
        {/* Particle scatter inset */}
        <rect x={8} y={28} width={W - 16} height={H - 60} fill="rgba(0,0,0,0.4)" rx={4} />
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={fill} opacity={0.75} />
        ))}
        {/* Header label */}
        <text x={10} y={18} fontSize={11} fill="var(--color-ink, #ddd)" fontFamily="monospace">
          lane {loupe.lane} · frag {loupe.fragmentIndex}{dyeName ? ` · ${dyeName}` : ''}
        </text>
        {/* Footer */}
        <text x={10} y={H - 6} fontSize={11} fill="var(--color-ink-muted, #888)" fontFamily="monospace">
          {fragment.bases} bp · {fragment.mass.toFixed(0)} ng
        </text>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Write `ts/src/components/gel/LoupePortalLayer.tsx`**

```tsx
import { useGelState } from './GelContext';
import { Loupe } from './Loupe';

export function LoupePortalLayer() {
  const state = useGelState();
  return (
    <>
      {state.loupes.map((l) => {
        const sample = state.samples[l.lane];
        if (!sample) return null;
        const frag = sample.fragments[l.fragmentIndex];
        if (!frag) return null;
        return <Loupe key={l.id} loupe={l} fragment={frag} />;
      })}
    </>
  );
}
```

- [ ] **Step 3: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/src/components/gel/Loupe.tsx ts/src/components/gel/LoupePortalLayer.tsx
git commit -m "feat(gel): Loupe component + LoupePortalLayer"
```

---

### Task 3: Cmd-click handler in GelOverlay

**Files:**
- Modify: `ts/src/components/gel/GelOverlay.tsx`

The overlay already has `onBandPointerDown`. Add a check for `metaKey` (or `ctrlKey` for Windows users) BEFORE the alt-clone branch. If meta/ctrl held, dispatch `ADD_LOUPE` instead of starting drag.

- [ ] **Step 1: Modify `ts/src/components/gel/GelOverlay.tsx`**

Find the `onBandPointerDown` function. Replace it:

```ts
  function onBandPointerDown(bandIdx: number, e: React.PointerEvent<SVGRectElement>) {
    e.preventDefault();
    const { lane, fragment } = bandToLaneFragment[bandIdx];
    const isCmd = e.metaKey || e.ctrlKey;
    if (isCmd) {
      // Cmd/Ctrl-click → open a loupe, do NOT start drag.
      dispatch({ type: 'ADD_LOUPE', lane, fragmentIndex: fragment, x: e.clientX, y: e.clientY });
      return;
    }
    if (e.altKey) {
      dispatch({ type: 'CLONE_FRAGMENT', laneIndex: lane, sourceIndex: fragment });
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: fragment + 1, startY: y });
    } else {
      const rect = svgRef.current!.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * state.gelSize.height;
      dispatch({ type: 'BEGIN_DRAG', laneIndex: lane, fragmentIndex: fragment, startY: y });
    }
  }
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: clean, 146/146 unit.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/src/components/gel/GelOverlay.tsx
git commit -m "feat(gel): cmd/ctrl-click on band opens a loupe"
```

---

### Task 4: Mount LoupePortalLayer in GelPage

**Files:**
- Modify: `ts/src/routes/GelPage.tsx`

- [ ] **Step 1: Add import + mount**

In `ts/src/routes/GelPage.tsx`, add the import:

```tsx
import { LoupePortalLayer } from '../components/gel/LoupePortalLayer';
```

Inside the `GelInner` component's return JSX, mount `<LoupePortalLayer />` near the bottom of the outer `<section>`, after the `selection-info` and `drop-error` divs (so it can sit above all other content):

```tsx
      <LoupePortalLayer />
```

- [ ] **Step 2: Verify dev server + typecheck + tests**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit
```

Expected: clean, 146/146.

```bash
npx playwright test --project chromium-webgpu smoke.spec.ts gel-page.spec.ts
```

Expected: 5 + 10 = 15/15 (no regressions to existing gel-page tests).

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/src/routes/GelPage.tsx
git commit -m "feat(gel): mount LoupePortalLayer in GelPage"
```

---

### Task 5: Playwright tests for loupes

**Files:**
- Modify: `ts/tests/visual/gel-page.spec.ts`

- [ ] **Step 1: Append two loupe tests to `ts/tests/visual/gel-page.spec.ts`**

```ts
test('cmd+click on a band opens a loupe popover', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.locator('[data-testid="band-0"]')).toBeVisible();
  // No loupes initially
  await expect(page.locator('[data-testid^="loupe-"]')).toHaveCount(0);
  // Cmd+click (meta on Mac, ctrl on others) on band 0
  // dispatchEvent with metaKey set
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  // One loupe should be open
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  // Loupe shows fragment metadata
  await expect(page.locator('[data-loupe-id="1"]')).toContainText('lane 0');
});

test('loupe close button removes the loupe', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Open a loupe
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(1);
  // Click close
  await page.getByTestId('loupe-close-1').click();
  await expect(page.locator('[data-loupe-id]')).toHaveCount(0);
});

test('multiple cmd+clicks open multiple loupes', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-0"]').dispatchEvent('pointerup');
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerdown', { button: 0, metaKey: true });
  await page.locator('[data-testid="band-1"]').dispatchEvent('pointerup');
  await expect(page.locator('[data-loupe-id]')).toHaveCount(2);
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test gel-page.spec.ts --project chromium-webgpu
```

Expected: 10 + 3 = 13 passed.

```bash
npx playwright test gel-page.spec.ts --project chromium-webgl2
```

Expected: 13 passed.

If a test fails because `dispatchEvent` doesn't propagate `metaKey` correctly on Linux Chrome, fall back to `page.keyboard.down('Meta')` + `mouse.down/up` sequence (similar to the M6b alt-drag tests).

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/tests/visual/gel-page.spec.ts
git commit -m "test(gel): cmd+click loupe + close + multiple loupes Playwright tests"
```

---

### Task 6: Mark M7 done, tag, verify CI

**Files:**
- Modify: `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`

- [ ] **Step 1: Update phase 1 overview M7 row**

OLD: `| M7 | Loupes + molecular sim | Cmd-click creates a loupe; loupe canvas renders toon-shaded particles via second WebGPU pipeline | TBW after M6 | Week 5 |`
NEW: `| M7 | Loupes (UI) | Cmd-click creates a loupe popover with fragment metadata + simple particle scatter (toon-shader molecular sim deferred to M7b) | [`m7-loupes.md`](2026-04-30-gelbox-ts-m7-loupes.md) | Week 5 |`

In Sub-plans:
OLD: `- [ ] **M7 Loupes + molecular sim** — TBW after M6`
NEW: `- [x] **M7 Loupes (UI)** — [`2026-04-30-gelbox-ts-m7-loupes.md`](2026-04-30-gelbox-ts-m7-loupes.md) (toon-shader molecular sim deferred to M7b)`

- [ ] **Step 2: Run full local CI green check**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit && npm run build
npx playwright test --project chromium-webgpu
npx playwright test --project chromium-webgl2
```

Expected:
- typecheck clean, 146/146 unit, build OK.
- chromium-webgpu: 22/22 (5 smoke + 4 dev visuals + perf + 13 gel-page).
- chromium-webgl2: 22/22.

- [ ] **Step 3: Commit, push, tag**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md \
        docs/superpowers/plans/2026-04-30-gelbox-ts-m7-loupes.md
git commit -m "docs(plan): mark M7 loupes (UI) complete (toon-shader sim deferred to M7b)"
git push origin main
git tag m7-loupes
git push origin m7-loupes
```

- [ ] **Step 4: Verify CI green**

```bash
cd /Users/shawn/code/gel
RUN_ID=$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
until gh run view "$RUN_ID" --json status --jq '.status' | grep -q '^completed$'; do
  sleep 30
done
gh run view "$RUN_ID" --json status,conclusion --jq '{status, conclusion}'
```

Expected: success.

---

## Self-review

**Spec coverage** (against M7 acceptance "Cmd-click creates a loupe; loupe canvas renders toon-shaded particles via second WebGPU pipeline"):
- ✅ Cmd-click creates a loupe — Tasks 1, 3, 5.
- ⚠️ "Loupe canvas renders toon-shaded particles" — DEFERRED. The loupe shows a simple SVG particle scatter (deterministic from fragment.randSeed) tinted with the fragment's color. The full WebGPU/WebGL2 toon-shader pipeline + Brownian motion sim is M7b.

**Risks specific to M7:**
1. Cmd-click on Linux: `metaKey` may correspond to the Windows key; we accept `ctrlKey` as well to be safe.
2. Loupes are absolute-positioned via `position: fixed`; if the user scrolls the page, loupes don't follow the band — they stay at their original click coords. Acceptable for M7 minimum.
3. Fragment color via `fragment.color` is the FOCUS color (per-fragment metadata, not the rendered color). For M6/M6b this is `[1,1,1]` for non-dye fragments. So loupes from monomer fragments display white particles. Acceptable; dye-fragment loupes show the dye color correctly.

Plan complete and saved to `docs/superpowers/plans/2026-04-30-gelbox-ts-m7-loupes.md`.
