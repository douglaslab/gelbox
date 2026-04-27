# M1 — Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the gel TS web port from the dash template, configure for multi-file static deployment, set up Vitest + Playwright with passing smoke tests, stand up three routes (Home, Gel, Dev) with WebGPU + WebGL2 capability detection visible on the Dev page, and wire CI.

**Architecture:** Direct copy of dash template into `ts/` subdirectory, then minimal modifications: strip the single-file plugin, switch to multi-file deployment with relative `base: './'`, add Phase-1 dependencies (`@webgpu/types`, Vitest, Playwright), add gel-specific routes. No engine code yet — that begins in M2.

**Tech Stack:** Node 22, Vite 5.4, React 18.3, TypeScript 5.6, Tailwind v4, Vitest 3, Playwright 1.49, `@webgpu/types`.

**Acceptance criteria (verify all in Task 8):**
- `npm run dev` opens to `/#/` (Home) with theme toggle working
- `npm run build` produces `ts/dist/` with multiple files; `npx serve ts/dist` works
- `npm run test:unit` passes (3 tests)
- `npm run test:visual` passes (4 tests)
- `/#/dev` shows live WebGPU adapter info or WebGL2 fallback summary
- CI green on push to `main`
- Initial commits pushed to `sdouglas/gel`

---

## Working directory note

All file paths below are absolute. The repo root is `/Users/shawn/code/gel/`. The TS app lives at `/Users/shawn/code/gel/ts/`. Run all `npm` commands from `/Users/shawn/code/gel/ts/`. Run all `git` commands from `/Users/shawn/code/gel/`.

---

### Task 1: Bootstrap repository from dash template

**Files:**
- Create: `/Users/shawn/code/gel/ts/` (copy from `/Users/shawn/code/dash/`)
- Modify: `/Users/shawn/code/gel/ts/package.json` (name, deps)
- Modify: `/Users/shawn/code/gel/ts/index.html` (title)

- [ ] **Step 1: Copy dash template into ts/**

```bash
mkdir -p /Users/shawn/code/gel/ts
rsync -av \
  --exclude='node_modules' \
  --exclude='dashboard' \
  --exclude='.git' \
  --exclude='*.tsbuildinfo' \
  --exclude='.tsbuildinfo*' \
  /Users/shawn/code/dash/ /Users/shawn/code/gel/ts/
```

- [ ] **Step 2: Verify file copy succeeded**

```bash
ls -la /Users/shawn/code/gel/ts/
```

Expected: directory listing includes `src/`, `docs/`, `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `.nvmrc`, `README.md`. No `node_modules/`, no `dashboard/`.

- [ ] **Step 3: Replace package.json with gel metadata**

Write `/Users/shawn/code/gel/ts/package.json`:

```json
{
  "name": "@douglaslab/gel",
  "private": true,
  "version": "0.0.1",
  "description": "Gelbox web port — TypeScript + WebGPU",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:visual": "playwright test",
    "test:visual:update": "playwright test --update-snapshots"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router-dom": "6.28.0"
  },
  "devDependencies": {
    "@playwright/test": "1.49.0",
    "@tailwindcss/vite": "4.0.0",
    "@types/node": "25.6.0",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "@vitejs/plugin-react": "4.3.4",
    "@webgpu/types": "0.1.50",
    "tailwindcss": "4.0.0",
    "typescript": "5.6.3",
    "vite": "5.4.11",
    "vitest": "3.0.0"
  }
}
```

- [ ] **Step 4: Update index.html title**

Open `/Users/shawn/code/gel/ts/index.html` and replace `<title>Dash</title>` with `<title>Gelbox</title>`.

- [ ] **Step 5: Update header brand in AppLayout**

In `/Users/shawn/code/gel/ts/src/components/AppLayout.tsx`, replace `<strong style={{ color: 'var(--color-ink)' }}>Dash</strong>` with `<strong style={{ color: 'var(--color-ink)' }}>Gelbox</strong>`.

- [ ] **Step 6: Install dependencies**

```bash
cd /Users/shawn/code/gel/ts && nvm use && npm install
```

Expected: `node_modules/` populated; package-lock.json created; no errors.

- [ ] **Step 7: Verify dev server starts**

```bash
cd /Users/shawn/code/gel/ts && npm run dev
```

Expected: Vite output `Local: http://localhost:5173/`. Open in browser; the page loads with header reading "Gelbox" and dash homepage content. Stop server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd /Users/shawn/code/gel && git add ts/ && git commit -m "scaffold: bootstrap ts/ from dash template"
```

---

### Task 2: Switch from single-file to multi-file static build

**Files:**
- Modify: `/Users/shawn/code/gel/ts/vite.config.ts`
- Modify: `/Users/shawn/code/gel/ts/tsconfig.json` (add `@webgpu/types`)

- [ ] **Step 1: Replace vite.config.ts**

Write `/Users/shawn/code/gel/ts/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';

const buildDate = new Date().toISOString().slice(0, 10);
let buildSha = 'untracked';
try {
  buildSha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // Not in a git repo or no commits yet
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true,
  },
});
```

- [ ] **Step 2: Add `@webgpu/types` to tsconfig.json `types` array**

Open `/Users/shawn/code/gel/ts/tsconfig.json`. Replace `"types": ["vite/client"]` with `"types": ["vite/client", "@webgpu/types"]`.

- [ ] **Step 3: Verify single-file plugin is no longer referenced**

```bash
cd /Users/shawn/code/gel/ts && grep -rn 'singlefile\|singleFile' . --include='*.ts' --include='*.tsx' --include='*.json' || echo "clean"
```

Expected: output is `clean` (or just the matches in `node_modules/` if grep doesn't honor `.gitignore`; if so, run with `--exclude-dir=node_modules`).

- [ ] **Step 4: Build and inspect output**

```bash
cd /Users/shawn/code/gel/ts && npm run build && ls dist/
```

Expected: `dist/index.html` plus a `dist/assets/` directory containing JS and CSS files. The HTML should reference `./assets/...` relative paths (verify with `head -20 dist/index.html`).

- [ ] **Step 5: Verify static-served bundle works**

```bash
cd /Users/shawn/code/gel/ts && npx serve dist -p 4173 &
sleep 2
curl -s http://localhost:4173 | grep -E '<title>|<div id="root">'
kill %1 2>/dev/null
```

Expected: output includes `<title>Gelbox</title>` and `<div id="root">`.

- [ ] **Step 6: Update .gitignore for new outDir**

The dash template ignored `dashboard`. We changed outDir to `dist`. Replace contents of `/Users/shawn/code/gel/ts/.gitignore`:

```
node_modules
dist
.DS_Store
*.local
.vite
```

- [ ] **Step 7: Verify dist is ignored**

```bash
cd /Users/shawn/code/gel && git status ts/dist 2>&1 | grep -E 'ignored|nothing'
```

Expected: `dist/` does not appear in `git status` output (it's ignored).

- [ ] **Step 8: Commit**

```bash
cd /Users/shawn/code/gel && git add ts/ && git commit -m "scaffold: switch from single-file to multi-file static build"
```

---

### Task 3: Add Vitest with first passing test

**Files:**
- Create: `/Users/shawn/code/gel/ts/vitest.config.ts`
- Create: `/Users/shawn/code/gel/ts/tests/unit/sanity.test.ts`

- [ ] **Step 1: Write a failing sanity test**

Create `/Users/shawn/code/gel/ts/tests/unit/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest smoke', () => {
  it('runs the test runner', () => {
    expect(2 + 2).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify Vitest is not yet configured**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

Expected: Vitest runs (it may pass with default config); whatever the result, proceed. Goal is to confirm the test runner is invoked.

- [ ] **Step 3: Add Vitest config**

Create `/Users/shawn/code/gel/ts/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

Expected output includes:
```
 ✓ tests/unit/sanity.test.ts (1 test)
   ✓ vitest smoke > runs the test runner
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

- [ ] **Step 5: Commit**

```bash
cd /Users/shawn/code/gel && git add ts/ && git commit -m "test: add vitest with sanity test"
```

---

### Task 4: Add Playwright with smoke test

**Files:**
- Create: `/Users/shawn/code/gel/ts/playwright.config.ts`
- Create: `/Users/shawn/code/gel/ts/tests/visual/smoke.spec.ts`
- Modify: `/Users/shawn/code/gel/ts/.gitignore` (add Playwright artifacts)

- [ ] **Step 1: Install Playwright Chromium**

```bash
cd /Users/shawn/code/gel/ts && npx playwright install chromium
```

Expected: chromium downloaded to Playwright's browser cache; "Chromium ... downloaded" message.

- [ ] **Step 2: Write the failing smoke test**

Create `/Users/shawn/code/gel/ts/tests/visual/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Gelbox');
});
```

- [ ] **Step 3: Add Playwright config**

Create `/Users/shawn/code/gel/ts/playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

- [ ] **Step 4: Add Playwright artifacts to .gitignore**

Append to `/Users/shawn/code/gel/ts/.gitignore`:

```
# Playwright
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 5: Run smoke test**

```bash
cd /Users/shawn/code/gel/ts && npm run test:visual
```

Expected: 1 test passes. Output includes `1 passed`.

- [ ] **Step 6: Commit**

```bash
cd /Users/shawn/code/gel && git add ts/ && git commit -m "test: add playwright smoke test for home page"
```

---

### Task 5: Add gel routes (Home, Gel, Dev) and tab navigation

**Files:**
- Modify: `/Users/shawn/code/gel/ts/src/App.tsx`
- Modify: `/Users/shawn/code/gel/ts/src/components/AppLayout.tsx`
- Create: `/Users/shawn/code/gel/ts/src/routes/GelPage.tsx`
- Create: `/Users/shawn/code/gel/ts/src/routes/DevPage.tsx`
- Modify: `/Users/shawn/code/gel/ts/src/routes/HomePage.tsx`
- Modify: `/Users/shawn/code/gel/ts/tests/visual/smoke.spec.ts`

- [ ] **Step 1: Update Playwright smoke test to assert all three routes**

Replace the contents of `/Users/shawn/code/gel/ts/tests/visual/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Gelbox');
});

test('all three tabs are visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dev' })).toBeVisible();
});

test('navigating to /#/gel shows gel page heading', async ({ page }) => {
  await page.goto('/#/gel');
  await expect(page.getByRole('heading', { name: 'Gel' })).toBeVisible();
});

test('navigating to /#/dev shows dev page heading', async ({ page }) => {
  await page.goto('/#/dev');
  await expect(page.getByRole('heading', { name: 'Dev' })).toBeVisible();
});
```

- [ ] **Step 2: Run tests to verify three new tests fail**

```bash
cd /Users/shawn/code/gel/ts && npm run test:visual
```

Expected: 1 passes ("home page renders title"); 3 fail (tabs not configured; routes don't exist).

- [ ] **Step 3: Create GelPage**

Create `/Users/shawn/code/gel/ts/src/routes/GelPage.tsx`:

```tsx
export function GelPage() {
  return (
    <section>
      <h1 style={{ color: 'var(--color-ink)', marginTop: 0 }}>Gel</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        Main gel rendering area. Renderer arrives in M2.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Create DevPage**

Create `/Users/shawn/code/gel/ts/src/routes/DevPage.tsx`:

```tsx
export function DevPage() {
  return (
    <section>
      <h1 style={{ color: 'var(--color-ink)', marginTop: 0 }}>Dev</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        Visual debugging playground. Capability detection arrives in Task 6.
      </p>
    </section>
  );
}
```

- [ ] **Step 5: Update HomePage**

Replace contents of `/Users/shawn/code/gel/ts/src/routes/HomePage.tsx`:

```tsx
export function HomePage() {
  return (
    <article style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '24px',
      background: 'var(--color-surface-raised)',
      border: '1px solid var(--color-grid)',
      borderRadius: '8px',
      color: 'var(--color-ink)',
    }}>
      <h1 style={{ marginTop: 0 }}>Gelbox</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        A web port of the Douglas Lab gel electrophoresis simulator. Built on
        TypeScript + WebGPU with WebGL2 fallback.
      </p>
      <ul style={{ color: 'var(--color-ink-muted)', lineHeight: 1.8, marginTop: '20px', paddingLeft: '20px' }}>
        <li>
          <a href="#/gel" style={{ color: 'var(--color-accent)' }}>Gel</a>
          {' — main app'}
        </li>
        <li>
          <a href="#/dev" style={{ color: 'var(--color-accent)' }}>Dev</a>
          {' — debug playground (GPU capability, single-band tests)'}
        </li>
      </ul>
    </article>
  );
}
```

- [ ] **Step 6: Update App.tsx with new routes**

Replace contents of `/Users/shawn/code/gel/ts/src/App.tsx`:

```tsx
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './routes/HomePage';
import { GelPage } from './routes/GelPage';
import { DevPage } from './routes/DevPage';
import { ThemeProvider } from './lib/theme';

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="gel" element={<GelPage />} />
            <Route path="dev" element={<DevPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
```

- [ ] **Step 7: Update TABS in AppLayout**

In `/Users/shawn/code/gel/ts/src/components/AppLayout.tsx`, find the existing `TABS` array (currently `[]`) and replace it with:

```tsx
const TABS: TabDef[] = [
  { to: '/', label: 'Home' },
  { to: '/gel', label: 'Gel' },
  { to: '/dev', label: 'Dev' },
];
```

The `TabDef` import is already present.

- [ ] **Step 8: Run all Playwright tests**

```bash
cd /Users/shawn/code/gel/ts && npm run test:visual
```

Expected: 4 tests pass.

- [ ] **Step 9: Run typecheck**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
cd /Users/shawn/code/gel && git add ts/ && git commit -m "scaffold: add Home/Gel/Dev routes with tab navigation"
```

---

### Task 6: Add WebGPU + WebGL2 capability detection on Dev page

**Files:**
- Create: `/Users/shawn/code/gel/ts/src/lib/gpu/adapter.ts`
- Modify: `/Users/shawn/code/gel/ts/src/routes/DevPage.tsx`
- Create: `/Users/shawn/code/gel/ts/tests/unit/adapter.test.ts`

- [ ] **Step 1: Write a failing unit test for capability shape**

Create `/Users/shawn/code/gel/ts/tests/unit/adapter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectGpuCapability } from '../../src/lib/gpu/adapter';

describe('detectGpuCapability (Node smoke)', () => {
  it('returns a Capability object with backend and reasons fields', async () => {
    const cap = await detectGpuCapability();
    expect(cap).toHaveProperty('backend');
    expect(cap).toHaveProperty('reasons');
    expect(Array.isArray(cap.reasons)).toBe(true);
  });

  it('Node environment falls back to "none"', async () => {
    const cap = await detectGpuCapability();
    expect(cap.backend).toBe('none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

Expected: failure with "Cannot find module '../../src/lib/gpu/adapter'" or similar.

- [ ] **Step 3: Implement detectGpuCapability**

Create `/Users/shawn/code/gel/ts/src/lib/gpu/adapter.ts`:

```ts
export type GpuBackend = 'webgpu' | 'webgl2' | 'none';

export interface GpuCapability {
  backend: GpuBackend;
  adapterInfo?: GPUAdapterInfo;
  features?: string[];
  limits?: Record<string, number>;
  reasons: string[];
}

export async function detectGpuCapability(): Promise<GpuCapability> {
  const reasons: string[] = [];

  if (typeof navigator === 'undefined') {
    return { backend: 'none', reasons: ['no navigator (Node?)'] };
  }

  if ('gpu' in navigator && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const info = await adapter.requestAdapterInfo?.();
        const features = Array.from(adapter.features ?? []);
        const limits: Record<string, number> = {};
        for (const key of Object.keys(adapter.limits ?? {})) {
          const v = (adapter.limits as unknown as Record<string, unknown>)[key];
          if (typeof v === 'number') limits[key] = v;
        }
        return {
          backend: 'webgpu',
          adapterInfo: info,
          features,
          limits,
          reasons: ['navigator.gpu.requestAdapter resolved'],
        };
      }
      reasons.push('navigator.gpu present but requestAdapter returned null');
    } catch (err) {
      reasons.push(`navigator.gpu.requestAdapter threw: ${(err as Error).message}`);
    }
  } else {
    reasons.push('navigator.gpu missing');
  }

  if (typeof document !== 'undefined') {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (gl) {
      return {
        backend: 'webgl2',
        reasons: [...reasons, 'webgl2 context created'],
      };
    }
    reasons.push('webgl2 context creation failed');
  } else {
    reasons.push('no document');
  }

  return { backend: 'none', reasons };
}
```

- [ ] **Step 4: Run unit test to verify it passes**

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```

Expected: 3 tests pass (1 sanity + 2 adapter).

- [ ] **Step 5: Wire capability detection into DevPage**

Replace contents of `/Users/shawn/code/gel/ts/src/routes/DevPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { detectGpuCapability, type GpuCapability } from '../lib/gpu/adapter';

export function DevPage() {
  const [cap, setCap] = useState<GpuCapability | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectGpuCapability().then((c) => {
      if (!cancelled) setCap(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h1 style={{ color: 'var(--color-ink)', marginTop: 0 }}>Dev</h1>
      <p style={{ color: 'var(--color-ink-muted)' }}>
        Visual debugging playground.
      </p>

      <h2 style={{ color: 'var(--color-ink)' }}>GPU capability</h2>
      {cap === null ? (
        <p style={{ color: 'var(--color-ink-muted)' }}>Detecting…</p>
      ) : (
        <pre
          data-testid="gpu-capability"
          style={{
            color: 'var(--color-ink)',
            background: 'var(--color-surface-raised)',
            padding: '1rem',
            border: '1px solid var(--color-grid)',
            borderRadius: '4px',
            overflow: 'auto',
            maxWidth: '720px',
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(cap, null, 2)}
        </pre>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Run typecheck**

```bash
cd /Users/shawn/code/gel/ts && npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Manual smoke check in browser**

```bash
cd /Users/shawn/code/gel/ts && npm run dev
```

Open `http://localhost:5173/#/dev` in Chrome (WebGPU-capable). Expected: page shows "GPU capability" with `"backend": "webgpu"` and adapter info populated. Toggle theme via header button — Dev page colors update.

If you have Firefox or Safari handy, open same URL there. Expected: `"backend": "webgl2"` (or `"none"` on very old browsers).

Stop server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd /Users/shawn/code/gel && git add ts/ && git commit -m "feat(dev): WebGPU + WebGL2 capability detection on /dev page"
```

---

### Task 7: Add CI workflow

**Files:**
- Create: `/Users/shawn/code/gel/.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow file**

Create `/Users/shawn/code/gel/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ts
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ts/.nvmrc
          cache: 'npm'
          cache-dependency-path: ts/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npx playwright install --with-deps chromium
      - run: npm run test:visual
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
cd /Users/shawn/code/gel && git add .github/ && git commit -m "ci: add GitHub Actions workflow for typecheck + tests + build"
```

---

### Task 8: Push and verify acceptance

**Files:** none (push and verify)

- [ ] **Step 1: Verify all commits are local-clean**

```bash
cd /Users/shawn/code/gel && git log --oneline && git status
```

Expected: 7 commits matching the task names; working tree clean.

- [ ] **Step 2: Push to GitHub**

```bash
cd /Users/shawn/code/gel && git push -u origin main
```

Expected: branch pushed.

- [ ] **Step 3: Watch CI to verify it passes**

```bash
cd /Users/shawn/code/gel && gh run watch --exit-status
```

Expected: workflow completes successfully (typecheck, unit, visual, build all green).

- [ ] **Step 4: Confirm CI ran on `main`**

```bash
cd /Users/shawn/code/gel && gh run list --branch main --limit 1
```

Expected: most recent run on `main` is `completed success`.

- [ ] **Step 5: Manually verify each acceptance criterion**

Run each check and confirm:

```bash
cd /Users/shawn/code/gel/ts && npm run dev
```
- [ ] Open `http://localhost:5173/#/`. Header reads "Gelbox". Three tabs visible. Home content visible. Theme toggle works.
- [ ] Click "Gel" tab. URL becomes `/#/gel`. Heading "Gel" visible.
- [ ] Click "Dev" tab. URL becomes `/#/dev`. GPU capability JSON visible, backend is "webgpu" (Chrome) or "webgl2" (Firefox/Safari).
- [ ] Stop dev server (Ctrl+C).

```bash
cd /Users/shawn/code/gel/ts && npm run build && ls dist/
```
- [ ] `dist/index.html` and `dist/assets/` exist.

```bash
cd /Users/shawn/code/gel/ts && npm run test:unit
```
- [ ] 3 tests pass.

```bash
cd /Users/shawn/code/gel/ts && npm run test:visual
```
- [ ] 4 tests pass.

```bash
cd /Users/shawn/code/gel && gh run list --limit 1
```
- [ ] Most recent run on main is "completed success".

- [ ] **Step 6: Tag M1 complete**

```bash
cd /Users/shawn/code/gel && git tag m1-scaffold && git push --tags
```

---

## M1 Self-review checklist

Before declaring M1 complete:

- [ ] Search for placeholders: `cd /Users/shawn/code/gel && grep -rn 'TBD\|TODO\|FIXME' ts/src ts/tests 2>/dev/null` produces nothing (or only intentional content not from this plan).
- [ ] All commands in this plan reference absolute paths starting with `/Users/shawn/code/gel/`.
- [ ] All TypeScript identifiers used in tests match implementation: `detectGpuCapability`, `GpuCapability`, `GpuBackend`.
- [ ] All Vite defines (`__BUILD_DATE__`, `__BUILD_SHA__`) referenced by `AppLayout.tsx` are still defined in `vite.config.ts`.
- [ ] `package.json` lock matches `package-lock.json` (run `npm install` if not).

If all check, M1 is shipped. Now ready to write `2026-04-27-gelbox-ts-m2-single-band.md` and begin M2.
