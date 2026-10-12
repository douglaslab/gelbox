# M8 — Save/Load + Drag-Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Save / Open / drag-drop file support to the `/#/gel` route. Two save formats: single sample (matches the existing `ladder-1kb.json` shape with `schema: 'gel-sample-v0'`) and full gel state (samples × N + sim context, `schema: 'gel-state-v0'`). Open auto-detects format from `schema` field. Drag-drop a JSON file onto the page → same loader. Doing M8 ahead of M7 (Loupes) per autonomous-execution prioritization.

**Architecture:** Save = `JSON.stringify` + `Blob` + anchor download (no `browser-fs-access` dep). Open = `<input type="file">` + `FileReader` + `JSON.parse` + dispatch. Drag-drop = `dragover/drop` listeners on the GelPage root. New `lib/gel/serialize.ts` provides pure functions: `serializeSample(sample)`, `serializeGelState(state)`, `deserializeFile(text)` (returns a tagged union).

**Tech Stack:** Same as M6/M6b. No new deps. Native File API only.

**M8 reference:** C++ source at `~/code/gelbox/src/AppSettingsView.cpp:69-116` (Save Selected Sample / Save Gel / Open buttons), `~/code/gelbox/src/GelboxApp.cpp:664-694` (file dialog handlers). C++ uses XML+JSON; we ship JSON only (legacy XML read-only is deferred — out of scope for M8 minimum).

---

## Scope

**In M8:**
- `ts/src/lib/gel/serialize.ts` — pure save/load helpers + tagged-union loader.
- `ts/src/components/chrome/FileControls.tsx` — Save Sample / Save Gel / Open buttons + file input.
- `ts/src/routes/GelPage.tsx` — wire FileControls into the layout; add drag-drop handlers on the page root.
- `ts/src/lib/gel/gelState.ts` — add `LOAD_GEL_STATE { samples, ctx, numLanes? }` action so a full gel can be restored.
- `ts/tests/unit/serialize.test.ts` — round-trip tests for both save formats.
- `ts/tests/unit/gelState.test.ts` — extend with LOAD_GEL_STATE test.
- `ts/tests/visual/gel-page.spec.ts` — append save/open/drag-drop tests.
- Phase 1 overview row added; tagged `m8-saveload`; CI green.

**Out of M8 (deferred):**
- Legacy XML import (acceptance text says "read-only XML support" — defer to M9 polish or skip; the live data flow is JSON in 2026).
- `browser-fs-access` dep (native File API is sufficient for download/upload).
- Save-on-Cmd-S keyboard shortcut.
- Auto-save / localStorage persistence.

**Non-goals:**
- Server-side persistence.
- Multi-file batch open.
- File-format migration (we keep `gel-sample-v0` and `gel-state-v0` versioned for future migrations).

---

## Decisions for this milestone

| Decision | Reason |
|---|---|
| JSON only (no XML) | Modern data flow; XML was a 2017 interop concern. Save round-trip is what matters |
| Two schemas: `gel-sample-v0` (already exists in fixtures) and `gel-state-v0` (new) | Single sample = the existing `ladder-1kb.json` shape; full gel adds `samples` array and `ctx` |
| `deserializeFile` returns a tagged union `{ kind: 'sample', sample } \| { kind: 'state', samples, ctx, numLanes }` | Caller (GelPage's drop handler) dispatches different actions per kind |
| Save Sample exports `state.samples[selectedLane]` | Selected lane is the user's "current" sample. If lane is empty, button is disabled |
| Save Gel always available | Even an all-empty gel is round-trippable (rare but valid) |
| Open is a single button with `<input type="file" accept=".json">` | Native; no library; Safari + Chrome + Firefox all support it |
| Drag-drop hits the entire `<GelInner>` section | Wide drop zone; intuitive |
| File picker accepts `.json` only | If user drops `.xml`, the `deserializeFile` throws; an error is shown via the existing `selection-info` slot |
| `LOAD_GEL_STATE` replaces `samples` + `ctx` + `numLanes` (if present) | Full restore. selectedLane resets to 0; selection cleared; drag cleared |
| `LOAD_FIXTURE` (M6/M6b) is the path for "load single sample into selected lane" — Open file calls it for sample-shaped JSON | Reuses existing wiring; sample drops into `state.selectedLane` |

---

## File structure for M8

```
ts/
  src/
    lib/
      gel/
        gelState.ts                          # MODIFY: add LOAD_GEL_STATE action
        serialize.ts                         # NEW
    components/
      chrome/
        FileControls.tsx                     # NEW
    routes/
      GelPage.tsx                            # MODIFY: mount FileControls, add drop handler
  tests/
    unit/
      serialize.test.ts                      # NEW
      gelState.test.ts                       # EXTEND: LOAD_GEL_STATE test
    visual/
      gel-page.spec.ts                       # EXTEND: file-input + drag-drop tests
docs/
  superpowers/
    plans/
      2026-04-27-gelbox-ts-phase-1-overview.md  # MODIFY: M8 row linked
      2026-04-30-gelbox-ts-m8-saveload.md        # this file
```

---

## Tasks

### Task 1: serialize.ts + LOAD_GEL_STATE action

**Files:**
- Create: `ts/src/lib/gel/serialize.ts`
- Modify: `ts/src/lib/gel/gelState.ts` (add LOAD_GEL_STATE action)
- Modify: `ts/tests/unit/gelState.test.ts` (add LOAD_GEL_STATE test)
- Test: `ts/tests/unit/serialize.test.ts`

- [ ] **Step 1: Write `ts/src/lib/gel/serialize.ts`**

```ts
import type { Sample } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';
import type { Buffer } from '../sim/buffer';

export interface SerializedSample {
  schema:    'gel-sample-v0';
  buffer:    Buffer;
  fragments: Sample['fragments'];
}

export interface SerializedGelState {
  schema:   'gel-state-v0';
  numLanes: number;
  samples:  (Sample | null)[];
  ctx: {
    voltage:      number;
    time:         number;
    ySpaceScale:  number;
    wellDamage:   number;
    gelBuffer:    Buffer;
    sampleBuffer: Buffer;
  };
}

export type DeserializedFile =
  | { kind: 'sample'; sample: Sample }
  | { kind: 'state';  samples: (Sample | null)[]; numLanes: number; ctx: SimContext };

export function serializeSample(s: Sample): string {
  const out: SerializedSample = {
    schema:    'gel-sample-v0',
    buffer:    s.buffer,
    fragments: s.fragments,
  };
  return JSON.stringify(out, null, 2);
}

export function serializeGelState(state: {
  samples: (Sample | null)[];
  numLanes: number;
  ctx: SimContext;
}): string {
  const out: SerializedGelState = {
    schema:   'gel-state-v0',
    numLanes: state.numLanes,
    samples:  state.samples,
    ctx:      state.ctx,
  };
  return JSON.stringify(out, null, 2);
}

export function deserializeFile(text: string): DeserializedFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Not valid JSON: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON root must be an object');
  }
  const obj = parsed as { schema?: unknown };
  if (obj.schema === 'gel-sample-v0') {
    const s = parsed as SerializedSample;
    return { kind: 'sample', sample: { buffer: s.buffer, fragments: s.fragments } };
  }
  if (obj.schema === 'gel-state-v0') {
    const s = parsed as SerializedGelState;
    return { kind: 'state', samples: s.samples, numLanes: s.numLanes, ctx: s.ctx };
  }
  throw new Error(`Unknown schema: ${String(obj.schema)}`);
}
```

- [ ] **Step 2: Add `LOAD_GEL_STATE` to `ts/src/lib/gel/gelState.ts`**

In the `Action` union type, add a new variant. In the reducer, add a new case. Find the existing `Action` union and `gelReducer` switch and apply these edits.

Add to the Action union (near LOAD_FIXTURE):
```ts
  | { type: 'LOAD_GEL_STATE'; samples: (Sample | null)[]; numLanes: number; ctx: SimContext }
```

Add to the reducer (near LOAD_FIXTURE):
```ts
    case 'LOAD_GEL_STATE': {
      const wellRects = computeWellRects(action.numLanes, state.gelSize);
      return {
        ...state,
        samples: action.samples.slice(),
        numLanes: action.numLanes,
        ctx: action.ctx,
        wellRects,
        selectedLane: 0,
        selectedFragmentIndex: null,
        drag: null,
      };
    }
```

- [ ] **Step 3: Write `ts/tests/unit/serialize.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { serializeSample, serializeGelState, deserializeFile } from '../../src/lib/gel/serialize';
import { BUFFER_TBE, BUFFER_TAE } from '../../src/lib/sim/buffer';
import type { Sample } from '../../src/lib/sim/sample';
import type { SimContext } from '../../src/lib/sim/gelSim';

const SAMPLE: Sample = {
  buffer: BUFFER_TBE,
  fragments: [{
    bases: 1000, mass: 50, degrade: 0, dye: -1, aggregate: [],
    aspectRatio: 1, color: [1, 1, 1],
  }],
};

const CTX: SimContext = {
  voltage: 70, time: 0.5, ySpaceScale: 200, wellDamage: 0,
  gelBuffer: BUFFER_TBE, sampleBuffer: BUFFER_TBE,
};

describe('serializeSample / deserializeFile (sample)', () => {
  it('round-trips a sample', () => {
    const text = serializeSample(SAMPLE);
    const back = deserializeFile(text);
    expect(back.kind).toBe('sample');
    if (back.kind === 'sample') {
      expect(back.sample.buffer).toEqual(SAMPLE.buffer);
      expect(back.sample.fragments.length).toBe(1);
      expect(back.sample.fragments[0].bases).toBe(1000);
    }
  });
  it('serialized JSON has schema gel-sample-v0', () => {
    const text = serializeSample(SAMPLE);
    expect(JSON.parse(text).schema).toBe('gel-sample-v0');
  });
});

describe('serializeGelState / deserializeFile (state)', () => {
  it('round-trips a multi-lane state', () => {
    const samples = [SAMPLE, null, null, null, null, null, null];
    const text = serializeGelState({ samples, numLanes: 7, ctx: CTX });
    const back = deserializeFile(text);
    expect(back.kind).toBe('state');
    if (back.kind === 'state') {
      expect(back.numLanes).toBe(7);
      expect(back.samples.length).toBe(7);
      expect(back.samples[0]?.fragments.length).toBe(1);
      expect(back.samples[1]).toBeNull();
      expect(back.ctx.voltage).toBe(70);
    }
  });
  it('serialized JSON has schema gel-state-v0', () => {
    const text = serializeGelState({ samples: [SAMPLE], numLanes: 1, ctx: CTX });
    expect(JSON.parse(text).schema).toBe('gel-state-v0');
  });
});

describe('deserializeFile error cases', () => {
  it('rejects invalid JSON', () => {
    expect(() => deserializeFile('not json')).toThrow(/not valid json/i);
  });
  it('rejects non-object root', () => {
    expect(() => deserializeFile('"hello"')).toThrow(/must be an object/);
  });
  it('rejects unknown schema', () => {
    expect(() => deserializeFile('{"schema":"foo-bar"}')).toThrow(/unknown schema/i);
  });
});

describe('deserializeFile reads fixture-shaped sample', () => {
  it('reads a TAE-buffer sample', () => {
    const taeSample: Sample = { ...SAMPLE, buffer: BUFFER_TAE };
    const text = serializeSample(taeSample);
    const back = deserializeFile(text);
    if (back.kind !== 'sample') throw new Error('expected sample');
    expect(back.sample.buffer).toEqual(BUFFER_TAE);
  });
});
```

- [ ] **Step 4: Add a `LOAD_GEL_STATE` test to `ts/tests/unit/gelState.test.ts`**

Append this test block to the existing `describe('gelReducer (multi-lane)', ...)` block:

```ts
  it('LOAD_GEL_STATE replaces samples + ctx and resets selection/drag', () => {
    const newSamples = [STARTING.samples[0], null, null];
    const newCtx = { ...STARTING.ctx, voltage: 200 };
    const next = gelReducer(
      { ...STARTING, selectedLane: 5, selectedFragmentIndex: 2, drag: { type: 'sample' as const, laneIndex: 0 } },
      { type: 'LOAD_GEL_STATE', samples: newSamples, numLanes: 3, ctx: newCtx }
    );
    expect(next.numLanes).toBe(3);
    expect(next.samples.length).toBe(3);
    expect(next.ctx.voltage).toBe(200);
    expect(next.selectedLane).toBe(0);
    expect(next.selectedFragmentIndex).toBeNull();
    expect(next.drag).toBeNull();
    // wellRects recomputed for the new lane count
    expect(next.wellRects.length).toBe(3);
  });
```

- [ ] **Step 5: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck && npm run test:unit
```

Expected: typecheck clean, unit tests = 132 + 9 (serialize) + 1 (LOAD_GEL_STATE) = 142/142.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/src/lib/gel/serialize.ts ts/src/lib/gel/gelState.ts \
        ts/tests/unit/serialize.test.ts ts/tests/unit/gelState.test.ts
git commit -m "feat(io): JSON serialize + deserialize for sample and gel-state"
```

---

### Task 2: FileControls component

**Files:**
- Create: `ts/src/components/chrome/FileControls.tsx`

Three buttons + a hidden file input + an inline error display.

- [ ] **Step 1: Write `ts/src/components/chrome/FileControls.tsx`**

```tsx
import { useRef, useState } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { serializeSample, serializeGelState, deserializeFile } from '../../lib/gel/serialize';

function downloadJson(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FileControls() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSample = state.samples[state.selectedLane];

  function onSaveSample() {
    if (!selectedSample) {
      setError('No sample in the selected lane');
      return;
    }
    setError(null);
    downloadJson(`${state.fixtureKey}-lane-${state.selectedLane}.json`, serializeSample(selectedSample));
  }

  function onSaveGel() {
    setError(null);
    downloadJson(`${state.fixtureKey}-gel.json`, serializeGelState({
      samples: state.samples,
      numLanes: state.numLanes,
      ctx: state.ctx,
    }));
  }

  function onOpenClick() {
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = deserializeFile(text);
      if (result.kind === 'sample') {
        dispatch({
          type: 'LOAD_FIXTURE',
          key: file.name.replace(/\.json$/i, ''),
          sample: result.sample,
          lane: state.selectedLane,
        });
      } else {
        dispatch({
          type: 'LOAD_GEL_STATE',
          samples: result.samples,
          numLanes: result.numLanes,
          ctx: result.ctx,
        });
      }
      setError(null);
    } catch (err) {
      setError(`Open failed: ${(err as Error).message}`);
    } finally {
      // Reset so the same file can be opened twice in a row
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <section data-testid="file-controls" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          data-testid="save-sample-btn"
          onClick={onSaveSample}
          disabled={!selectedSample}
          style={{ padding: '6px 10px' }}
        >
          Save sample
        </button>
        <button data-testid="save-gel-btn" onClick={onSaveGel} style={{ padding: '6px 10px' }}>
          Save gel
        </button>
        <button data-testid="open-btn" onClick={onOpenClick} style={{ padding: '6px 10px' }}>
          Open…
        </button>
        <input
          ref={fileInputRef}
          data-testid="file-input"
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>
      {error && (
        <div data-testid="file-error" style={{ color: 'var(--color-danger, #c44)', fontSize: 12 }}>
          {error}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/src/components/chrome/FileControls.tsx
git commit -m "feat(io): FileControls — Save sample / Save gel / Open buttons"
```

---

### Task 3: Wire FileControls into GelPage + add drag-drop

**Files:**
- Modify: `ts/src/routes/GelPage.tsx`

Add `<FileControls />` below `<GelControls />`. Add `onDragOver` + `onDrop` handlers on the outer `<section>` to accept JSON file drops.

- [ ] **Step 1: Read the current GelPage**

```bash
cat /Users/shawn/code/gel/ts/src/routes/GelPage.tsx
```

- [ ] **Step 2: Modify GelPage to add FileControls + drag-drop**

Add an import for FileControls and the deserializer:

```tsx
import { FileControls } from '../components/chrome/FileControls';
import { deserializeFile } from '../lib/gel/serialize';
import { useGelDispatch } from '../components/gel/GelContext';
```

Inside the `GelInner` component, get the dispatch hook. Add an `onDragOver` and `onDrop` handler that reads the dropped file. The outer `<section>` element gets `onDragOver={(e) => e.preventDefault()}` (necessary to allow drop) and `onDrop={...}` that dispatches based on the result. Add a try/catch for malformed JSON.

The complete updated `GelInner` looks like this:

```tsx
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

  const selectedSample = state.samples[state.selectedLane];
  const selectedFrag = selectedSample && state.selectedFragmentIndex !== null
    ? selectedSample.fragments[state.selectedFragmentIndex]
    : null;

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

  return (
    <section
      data-testid="gel-page"
      style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <h1 style={{ marginTop: 0 }}>Gel</h1>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GelControls />
          <FileControls />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <MicrotubeRow />
          <div style={{ position: 'relative' }}>
            <GelCanvas bands={bands} gelSize={state.gelSize} pixelsPerUnit={state.pixelsPerUnit} />
            <GelOverlay bands={bands} bandToLaneFragment={bandToLaneFragment} />
          </div>
        </div>
      </div>
      <div data-testid="selection-info" style={{ marginTop: 16, fontSize: 13, color: 'var(--color-ink-muted)' }}>
        {selectedFrag
          ? `lane ${state.selectedLane} fragment ${state.selectedFragmentIndex}: ${selectedFrag.bases} bp, ${selectedFrag.mass} ng`
          : selectedSample
            ? `lane ${state.selectedLane}: ${selectedSample.fragments.length} fragments — click or tab through bands`
            : `lane ${state.selectedLane}: empty`}
      </div>
      {dropError && (
        <div data-testid="drop-error" style={{ marginTop: 8, color: 'var(--color-danger, #c44)', fontSize: 12 }}>
          {dropError}
        </div>
      )}
    </section>
  );
}
```

You'll also need to add `useState` to the existing `react` import if not already present:

```tsx
import { useMemo, useState } from 'react';
```

- [ ] **Step 3: Verify dev server + typecheck + existing tests**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit
```

Expected: typecheck clean, 142/142 unit.

```bash
npx playwright test --project chromium-webgpu smoke.spec.ts single-band.spec.ts multi-band.spec.ts sim-ladder.spec.ts gel-page.spec.ts
```

Expected: 8 + 7 = 15/15 (no regressions).

- [ ] **Step 4: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/src/routes/GelPage.tsx
git commit -m "feat(io): wire FileControls + drop handler into GelPage"
```

---

### Task 4: Playwright tests for save / open / drag-drop

**Files:**
- Modify: `ts/tests/visual/gel-page.spec.ts`

Three new tests appended to the existing spec:
1. **Save sample** click triggers download (verify the download intent — Playwright captures it).
2. **Open via file input** loads a sample-shaped JSON file (using `setInputFiles`).
3. **Drag-drop a sample-shaped JSON file** loads it.

- [ ] **Step 1: Append to `ts/tests/visual/gel-page.spec.ts`**

```ts
test('Save sample button triggers a JSON download', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  // Wait for the page to mount the canvas + buttons (i.e. the renderer ready)
  await expect(page.getByTestId('save-sample-btn')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('save-sample-btn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

test('Open file input loads a sample-shaped JSON', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.getByTestId('open-btn')).toBeVisible();
  // Build a tiny sample JSON with a single fragment we can identify.
  const samplePayload = {
    schema: 'gel-sample-v0',
    buffer: { tris: 44.5, borate: 44.5, acetate: 0, edta: 1 },
    fragments: [
      { bases: 12345, mass: 50, degrade: 0, dye: -1, aggregate: [], aspectRatio: 1, color: [1, 1, 1] },
    ],
  };
  // setInputFiles directly on the hidden file input.
  await page.getByTestId('file-input').setInputFiles({
    name: 'test-sample.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(samplePayload), 'utf8'),
  });
  // Verify selection-info reflects the new sample (only 1 fragment with 12345 bp).
  // Click band-0 to trigger selection text containing "12345 bp".
  // First, the bands map auto-recomputes from new sample. Since it has 1 fragment,
  // there should be 1 band (data-testid="band-0").
  await expect(page.locator('[data-testid="band-0"]')).toBeVisible();
  await page.locator('[data-testid="band-0"]').click({ button: 'left' });
  await expect(page.getByTestId('selection-info')).toContainText('12345 bp');
});

test('Drag-drop a sample-shaped JSON loads it', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-webgpu' && process.platform === 'linux') {
    test.skip(true, 'WebGPU adapter not available on Linux GitHub runners');
  }
  await page.goto('/#/gel');
  await expect(page.getByTestId('gel-page')).toBeVisible();
  const samplePayload = {
    schema: 'gel-sample-v0',
    buffer: { tris: 44.5, borate: 44.5, acetate: 0, edta: 1 },
    fragments: [
      { bases: 9876, mass: 50, degrade: 0, dye: -1, aggregate: [], aspectRatio: 1, color: [1, 1, 1] },
    ],
  };
  // Synthesize a DataTransfer and dispatch drag/drop events.
  const target = page.getByTestId('gel-page');
  await target.evaluate((el, payload) => {
    const dt = new DataTransfer();
    const file = new File([payload], 'dragged.json', { type: 'application/json' });
    dt.items.add(file);
    const dragOver = new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt });
    el.dispatchEvent(dragOver);
    const drop = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
    el.dispatchEvent(drop);
  }, JSON.stringify(samplePayload));
  await expect(page.locator('[data-testid="band-0"]')).toBeVisible();
  await page.locator('[data-testid="band-0"]').click({ button: 'left' });
  await expect(page.getByTestId('selection-info')).toContainText('9876 bp');
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npx playwright test gel-page.spec.ts --project chromium-webgpu
```

Expected: 7 + 3 = 10 passed.

```bash
npx playwright test gel-page.spec.ts --project chromium-webgl2
```

Expected: 10 passed.

If the drag-drop test fails (DataTransfer + DragEvent not fully supported in some Chrome versions for synthetic events), the fallback is to dispatch a custom event that mimics the drop (set `dataTransfer.files = [file]`). The current approach uses native `DataTransfer` constructor which is supported in modern Chromium.

- [ ] **Step 3: Commit**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add ts/tests/visual/gel-page.spec.ts
git commit -m "test(io): save/open/drag-drop Playwright tests"
```

---

### Task 5: Mark M8 done, tag, verify CI

**Files:**
- Modify: `docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md`

- [ ] **Step 1: Update the milestones table M8 row**

OLD: `| M8 | Save/load + drag-drop | JSON round-trip via browser-fs-access; drag-drop file loading; legacy XML read-only support | TBW after M7 | Week 5.5 |`
NEW: `| M8 | Save/load + drag-drop | JSON round-trip (native File API), drag-drop file loading; legacy XML deferred | [`m8-saveload.md`](2026-04-30-gelbox-ts-m8-saveload.md) | Week 5.5 |`

In Sub-plans:
OLD: `- [ ] **M8 Save/load + drag-drop** — TBW after M7`
NEW: `- [x] **M8 Save/load + drag-drop** — [`2026-04-30-gelbox-ts-m8-saveload.md`](2026-04-30-gelbox-ts-m8-saveload.md) (legacy XML deferred to M9)`

- [ ] **Step 2: Run full local CI green check**

```bash
cd /Users/shawn/code/gel/ts
lsof -ti:5173 | xargs kill -9 2>/dev/null
npm run typecheck && npm run test:unit && npm run build
npx playwright test --project chromium-webgpu
npx playwright test --project chromium-webgl2
```

Expected:
- typecheck clean, 142/142 unit, build OK.
- chromium-webgpu: 19/19 (5 smoke + 4 dev visuals + 10 gel-page).
- chromium-webgl2: 19/19.

- [ ] **Step 3: Commit, push, tag**

```bash
cd /Users/shawn/code/gel
git pull --rebase origin main || true
git add docs/superpowers/plans/2026-04-27-gelbox-ts-phase-1-overview.md \
        docs/superpowers/plans/2026-04-30-gelbox-ts-m8-saveload.md
git commit -m "docs(plan): mark M8 save/load complete (legacy XML deferred to M9)"
git push origin main
git tag m8-saveload
git push origin m8-saveload
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

Expected: `success`. If not, capture failure with `gh run view <id> --log-failed | head -200`.

---

## Self-review

**Spec coverage:**
- ✅ JSON round-trip — Tasks 1, 4 cover serialize + deserialize for both shapes.
- ✅ Drag-drop file loading — Task 3 wires `onDrop`; Task 4 tests it.
- ⚠️ Legacy XML read-only — DEFERRED to M9. Phase-1-2026 data is JSON-native; XML import is an interop concession that doesn't gate the rest of Phase 1.
- ✅ Buttons available — Save sample, Save gel, Open all wired.

**Placeholder scan:** No TBDs.

**Risks specific to M8:**
1. Browser security: anchor-download prompts the user for save location. This is intentional and matches expected UX.
2. Drag-drop synthetic events in Playwright: the `DataTransfer` constructor is supported in all modern Chromium; older versions may need a different synthesis. Test 4 documents the fallback.
3. Schema migrations: future versions may need `gel-sample-v1` etc. The current code throws on unknown schema, which surfaces the issue cleanly to the user.

Plan complete and saved to `docs/superpowers/plans/2026-04-30-gelbox-ts-m8-saveload.md`.
