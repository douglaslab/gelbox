# Dash: build and runtime recipe

The mechanical companion to `principles.md`. Where principles live for years,
this file reflects current dep choices. When a dep churns, only this file
needs editing.

This file documents the `dash` skeleton as it ships. New projects clone the
skeleton and only revisit this doc when bumping versions or adding optional
add-ons (Plotly, react-three-fiber, 3DMol).

---

## 1. Stack and versions

Node 22 LTS (`.nvmrc`). The current dep set:

- **Vite** 5.4 — bundler.
- **React** 18.3 — UI runtime.
- **TypeScript** 5.6 — type system.
- **Tailwind v4** with `@tailwindcss/vite` — utility CSS, native CSS-variable
  tokens via the `@theme` block.
- **react-router-dom** 6.28 — `HashRouter` only (history API does not work
  on `file://`).
- **vite-plugin-singlefile** 2.3 with `removeViteModuleLoader: true` —
  inlines JS + CSS into a single `dashboard/index.html`.

Optional add-ons (only when a project needs them):

- `@react-three/fiber` + `drei` — declarative Three.js for 3D viewers.
- `react-plotly.js` — interactive charts (size budget warning; lazy-import).
- `3Dmol.js` — protein/molecule viewer wrapper (the dbp pattern).

---

## 2. The four `vite.config.ts` non-negotiables

These four settings make the bundle work from `file://`. Drop any of them
and the artifact silently breaks (asset 404s, blank page in browsers that
refuse module loading from `file://`).

1. **`base: './'`** — relative asset paths. `file://` has an opaque origin;
   absolute paths resolve to the filesystem root.
2. **`viteSingleFile()` plugin** with `removeViteModuleLoader: true` —
   inlines every `import()` and CSS into one HTML file. Without it, the
   HTML loads but the JS module fails to fetch under `file://`.
3. **`build.outDir: 'dashboard'`** — emits to `dashboard/` for the
   double-click test. Keeps the output directory distinct from `dist/`
   (which downstream tools sometimes reach into).
4. **`cssCodeSplit: false` + `assetsInlineLimit: 100_000_000`** — folds CSS
   and assets (images, 3D models, fonts) inline. The high inline limit is
   intentional: a single 80 MB HTML file is fine; a `dashboard/` directory
   with sibling assets is not.

The full config that ships with the skeleton, with build-time freeze stamp:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { execSync } from 'node:child_process';

const buildDate = new Date().toISOString().slice(0, 10);
let buildSha = 'untracked';
try {
  buildSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not in a git repo or no commits yet
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __BUILD_SHA__: JSON.stringify(buildSha),
  },
  build: {
    outDir: 'dashboard',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
```

The `define` block injects the build date and short-SHA so the footer in
`AppLayout` can show them — the snapshot date and commit are the
freeze-stamp on the artifact.

---

## 3. Tailwind v4 setup and theme propagation

Tailwind v4 reads tokens from a CSS `@theme` block. The skeleton ships
semantic tokens (not color names): `--color-ink`, `--color-ink-muted`,
`--color-surface`, `--color-surface-raised`, `--color-accent`,
`--color-grid`, plus `--color-success`, `--color-warning`, `--color-danger`.

Light values live in the default `@theme` block; dark values live under
`[data-theme="dark"]`. The toggle button writes that attribute on `<html>`.

```css
@import "tailwindcss";

@theme {
  /* Light theme tokens (default) */
  --color-ink:               #1f2933;
  --color-ink-muted:         #5a6573;
  --color-surface:           #fbfaf6;
  --color-surface-raised:    #ffffff;
  --color-accent:            #2f6fb3;
  --color-grid:              #e4e1d6;
  --color-success:           #4f8a4a;
  --color-warning:           #c08a2a;
  --color-danger:            #b03a2e;
}

[data-theme="dark"] {
  --color-ink:               #e9e6dc;
  --color-ink-muted:         #9ba2ad;
  --color-surface:           #15181d;
  --color-surface-raised:    #1f242b;
  --color-accent:            #6aa3d8;
  --color-grid:              #2c313a;
  --color-success:           #6fb86a;
  --color-warning:           #d9a657;
  --color-danger:            #d05a4e;
}

html, body, #root {
  height: 100%;
}

body {
  background-color: var(--color-surface);
  color: var(--color-ink);
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  margin: 0;
}
```

Theme propagation — the place principle 14 is enforced:

- **Toggle button in `AppLayout` header.** Writes `data-theme="dark"|"light"`
  on `<html>`, persists to `localStorage` with try/catch (gracefully
  degrades on `file://` browsers that block storage).
- **Theme context.** A small React context (`useTheme()`) exposes
  `theme: 'light'|'dark'` and a setter, and updates the DOM attribute.
  Components that need to *react* to theme change (3D scenes, Plotly)
  subscribe to it; pure CSS components don't need to.
- **Transparent PNGs ship transparent.** No baked background. Renders sit
  on the dashboard's surface token.
- **SVG: `currentColor` everywhere.** All authored SVGs use
  `fill="currentColor"` / `stroke="currentColor"`. Inline SVGs (not
  `<img src=>`) so the cascade reaches them.
- **3D scenes (r3f).** Read CSS variables via
  `getComputedStyle(document.documentElement).getPropertyValue('--color-surface')`
  *inside an effect that depends on theme*, not just at mount. Update
  background, materials, and grid lines on every change.
- **Charts (Plotly / Recharts).** A `themeToChartLayout()` helper maps
  tokens into chart-library config; re-apply on theme change. No hex
  literals in chart code.

---

## 4. `AppLayout` + `TabNav`

The skeleton ships an `AppLayout` with header (project name + theme toggle),
a `TabNav` using `react-router`'s `NavLink` with `isActive` styling, an
`<Outlet />` for the active route, and a footer.

The footer renders `Built ${__BUILD_DATE__} · ${__BUILD_SHA__}` — the
build-time freeze stamp injected via the `define` block above. The snapshot
date and commit travel with the artifact.

`TabNav` takes a `TabDef[]` (`{ to: string; label: string }[]`). Empty array
hides the nav — useful for a single-page artifact during early scaffolding.
New projects fill `TABS` in `AppLayout.tsx` to add chapters.

---

## 5. Conventions

Directory layout under `src/`:

- `src/data/` — typed static data (TypeScript objects, not JSON).
- `src/routes/` — page components (one per tab; e.g. `HomePage.tsx`).
- `src/components/` — page-agnostic UI (`AppLayout`, `TabNav`,
  `ThemeToggle`).
- `src/lib/` — utilities (`theme.tsx`, helpers).

No state library. `useState` is enough until it isn't, and when it isn't,
hoist to a single React context, not Redux. The dashboards in this lineage
have shipped with zero global state libraries.

---

## 6. Build and verify

```bash
nvm use   # or: export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm install
npm run dev      # iteration server (http://localhost:5173)
npm run build    # produces dashboard/index.html
open dashboard/index.html   # the canonical verification — NOT vite preview
```

The double-click test is load-bearing. The dev server has a real origin
and won't catch the regressions that matter (module loading on `file://`,
asset path resolution, theme propagation in the inlined bundle).

Bundle-size budget: <100 MB total, flag any single asset over ~10 MB. The
verification list ends with: "toggle the theme on every page, watch for
color leaks." That sentence is principle 14 in operational form.

---

## 7. Common gotchas

- **Node 25 + npm `EBADF`.** Node 25 is the current macOS default; `npm
  install` hangs against the registry. Use Node 22 (`.nvmrc` pins it; or
  prepend `/opt/homebrew/opt/node@22/bin` to PATH).
- **`localStorage` on `file://`.** Not guaranteed across browsers. Treat as
  a UX nicety only; never store anything load-bearing there. The theme
  context wraps storage in try/catch.
- **drei's `<Html>` overlay** needs `transform={false}` for orthographic
  plan views. Otherwise the overlay drifts in screen space.
- **react-three-fiber + StrictMode** mounts twice in dev. Use `useRef` for
  engines/contexts that must initialize once. The skeleton's StrictMode
  wrapping is fine; r3f scenes need this awareness.
- **Hooks-unconditional + render-conditional.** When a sandbox supports
  lineup mode and renders one or three sims, call `useSandboxEngine()`
  three times *unconditionally* — React's rules forbid skipping hook calls
  — and choose at *render* time which results to display. The unused
  engine results are computed but not painted.

---

## 8. Optional add-ons

- **Plotly** via `react-plotly.js` — lazy-import inside a `<Suspense>`
  boundary so the chart bundle doesn't push the artifact past the size
  budget. Apply `themeToChartLayout()` on mount and on every theme change.
- **3DMol.js** wrapper for protein viewers — the dbp pattern. Wrap as an
  imperative effect inside a React component, with the viewer instance
  held in a ref. Subscribe to theme changes to update the canvas
  background and labels.
- **react-three-fiber + drei** — the ads pattern for origami and chip
  visualization. Read theme tokens in an effect (see §3). Use `useRef`
  for engines (StrictMode awareness, see §7).

---

## References

- [`principles.md`](principles.md) — the design playbook this recipe
  supports.
- [`sandbox-design.md`](sandbox-design.md) — sandbox design rules.
- [`sandbox-engine.md`](sandbox-engine.md) — sandbox engine implementation
  patterns.
