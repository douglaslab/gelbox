# dbp → dash migration playbook

A port plan for `~/code/dbp/`. dbp's layout is good and the Python build is
fine; this is a framework swap, not a redesign. Estimate: ~3 days.

## 1. What's preserved

The 9-tab information architecture (Overview, Targets, Generators,
Validators, Filters, Lead set, Viewer, Performance, Manuscript). The
existing color and spacing semantics in `dashboard_src/css/tokens.css`,
mapped 1:1 onto Tailwind v4 tokens. The Python build
(`build_dashboard.py`, CSV → `combined_metrics.json`). Structures bundled
under `structures/`. Hash routing (already in place).

## 2. What changes

Bundler: none → Vite. Template language: vanilla JS + Jinja-style
partials → React TSX. CSS framework: hand-rolled `tokens.css` /
`layout.css` / `components.css` → Tailwind v4 with mapped tokens. Build
target: a `dashboard/` directory with separate JS/CSS → a single
`dashboard/index.html` via `vite-plugin-singlefile`.

## 3. Token mapping table

Every CSS variable in current use maps to a Tailwind v4 `@theme` token.
The visual output is identical when the mapping is correct. dbp does
not use Tabler — its variables are hand-defined in
`dashboard_src/css/tokens.css` with paired light/dark blocks; the table
below covers every variable observed there.

| dbp variable | Tailwind v4 token | Light value | Dark value |
|---|---|---|---|
| --page-bg | --color-surface | #f1f5f9 | #1a1b2e |
| --card-bg | --color-surface-raised | #ffffff | #232533 |
| --log-bg | --color-surface-log | #f8fafc | #0d1117 |
| --log-fg | --color-ink-log | #1e293b | #c9d1d9 |
| --viewer-bg | --color-surface-viewer | #f0f0f0 | #0d1117 |
| --text-primary | --color-ink | #1e293b | #e2e8f0 |
| --text-secondary | --color-ink-muted | #475569 | #94a3b8 |
| --text-muted | --color-ink-faint | #94a3b8 | #64748b |
| --file-border | --color-grid | rgba(0,0,0,0.08) | rgba(255,255,255,0.05) |
| --file-hover | --color-grid-hover | rgba(0,0,0,0.03) | rgba(255,255,255,0.03) |
| --color-success-rgb | --color-success-rgb | 22,163,74 | 74,222,128 |
| --color-warning-rgb | --color-warning-rgb | 217,119,6 | 251,191,36 |
| --color-danger-rgb | --color-danger-rgb | 220,38,38 | 248,113,113 |
| --color-info-rgb | --color-info-rgb | 37,99,235 | 96,165,250 |
| --color-muted-rgb | --color-muted-rgb | 107,114,128 | 156,163,175 |
| --color-gen-rfd3 | --color-gen-rfd3 | #3b82f6 | #3b82f6 |
| --color-gen-boltzgen | --color-gen-boltzgen | #14b8a6 | #14b8a6 |
| --color-gen-ph | --color-gen-ph | #06b6d4 | #06b6d4 |
| --color-val-af3 | --color-val-af3 | #8b5cf6 | #8b5cf6 |
| --color-val-boltz2 | --color-val-boltz2 | #22c1c3 | #22c1c3 |
| --color-val-chai1 | --color-val-chai1 | #10b981 | #10b981 |
| --color-val-protenix | --color-val-protenix | #f59e42 | #f59e42 |
| --color-ligandmpnn | --color-ligandmpnn | #84cc16 | #84cc16 |
| --color-pass | --color-pass | #5b9bd5 | #5b9bd5 |
| --color-fail | --color-fail | #e07070 | #e07070 |
| --color-filtered | --color-filtered | #d56ed5 | #d56ed5 |
| --color-chain-a | --color-chain-a | #00bcd4 | #00bcd4 |
| --color-chain-b | --color-chain-b | #ff9800 | #ff9800 |
| --color-chain-c | --color-chain-c | #8bc34a | #8bc34a |
| --color-target-1..11 | --color-target-1..11 | (per tokens.css) | (per tokens.css) |
| --space-xs..xl | --space-xs..xl | 0.25rem..2rem | 0.25rem..2rem |

The categorical brand/method colors (generators, validators, chains,
targets) are theme-invariant by design — the same hex in both modes.

## 4. Component migration order

`AppLayout` first; then Overview (smallest); then one tab at a time in
order of complexity. Map each tab to its current partial in
`~/code/dbp/dashboard_src/partials/`:

- Overview → `overview.html`
- Targets → `targets.html` (and per-target `target.html`)
- Generators → `generators.html`
- Validators → `validators.html` (with per-validator partials
  `af3.html`, `boltz2.html`, `chai1.html`, `protenix.html`)
- Filters → `filters.html`
- Lead set → `lead_set.html`
- Performance → `performance.html`
- Manuscript → `manuscript.html`
- Viewer → `viewer.html` (last, because of 3DMol)

Port top-down so the executor doesn't shuffle.

## 5. Wrappers, not rewrites

Plotly stays — wrap each chart type (scatter, histogram, Sankey) in a
small React component that reads theme tokens via `getComputedStyle` and
re-applies layout on theme change. 3DMol.js stays — wrap as an imperative
effect inside a React component, with the viewer instance held in a ref.
The cross-highlight module ports as a small React context (no Zustand).

## 6. Data layer

`combined_metrics.json` becomes a typed `src/data/metrics.ts` import.
Update the Python build to emit both `combined_metrics.json` (for any
remaining vanilla pages) and a generated `metrics.types.ts` derived from
the CSV schema. The artifact bundles the typed import; no runtime
`fetch()`.

## 7. Definition of done

`npm run typecheck` and `npm run lint` clean. All 9 tabs render. Theme
toggle leaks nothing on any tab (verify per `dash/docs/principles.md`
rule 14). `open dashboard/index.html` works from `file://` with no
console errors.

## 8. Estimate

~3 days, mostly mechanical.

## References

- `dash/docs/principles.md` — apply on every tab as it ports.
- `dash/docs/recipe.md` — the build setup the new dbp clones from.
- `~/code/dbp/dashboard_src/` — the source the migration reads from.
- `~/code/dbp/build_dashboard.py` — the Python step that stays.
