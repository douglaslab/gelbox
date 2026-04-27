# Dash

A starting point for static, `file://`-deployable dashboards. Vite + React +
TypeScript + Tailwind v4 + HashRouter, bundled into a single
`dashboard/index.html` via `vite-plugin-singlefile`.

## Quick start

```bash
nvm use   # or: export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm install
npm run dev      # iteration server
npm run build    # produces dashboard/index.html
open dashboard/index.html   # double-click test (the canonical verification)
```

## What to read next

- [`docs/principles.md`](docs/principles.md) — the dashboard design playbook.
- [`docs/recipe.md`](docs/recipe.md) — the build/runtime guide.
- [`docs/sandbox-design.md`](docs/sandbox-design.md) — when designing
  sandboxes inside the dashboard.
- [`docs/sandbox-engine.md`](docs/sandbox-engine.md) — when extending or
  forking a sandbox engine.

## What ships in the skeleton

- Vite config wired for single-file `file://` output.
- Tailwind v4 with semantic theme tokens (`--color-ink`, `--color-surface`,
  ...) and a `data-theme` toggle that propagates to inline SVG and CSS.
- `HashRouter` (the History API does not work on `file://`).
- `AppLayout` with header + `TabNav` + footer with build-time freeze stamp
  (date + git short-SHA).
- A single `HomePage` stub that exists to verify theme propagation.

Nothing else. New projects add tabs, data, and sandboxes per `principles.md`.
