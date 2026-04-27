# Dashboard design principles

A working playbook for the kind of dashboards we build at Nanodesk: static,
client-side, `file://`-deployable artifacts that teach a project, freeze a
snapshot, and organize what was tried.

This is the dashboard-layer companion to
[`sandbox-design.md`](sandbox-design.md), which governs the *sandbox*
layer. Sandboxes nest inside pages; pages nest inside the dashboard.

Audience: anyone scaffolding a new dashboard, reviewing one for an audience
hand-off, or asking "what kind of artifact are we building here, exactly?"

---

## 1. Aim

A dashboard in this lineage is three things in one artifact:

1. **A teach-the-project on-ramp** — a new collaborator should be able to
   open `index.html`, click around, and have a working mental model of the
   project within ~30 minutes.
2. **A frozen snapshot** — the file a stakeholder receives names a date and a
   commit. It will not change after that. The audience can read it offline,
   on a flight, on a USB stick.
3. **An organized record of what was tried** — including what didn't work.
   Experiments and conditions are first-class content, not a methods
   appendix.

The principles in §4 are the rules that keep an artifact recognisable as all
three at once.

---

## 2. Lineage and references

Dashboards in this style sit inside the *explorable explanations* tradition:

- **Bret Victor** — *Inventing on Principle*, *Up and Down the Ladder of
  Abstraction*, *Media for Thinking the Unthinkable*. The case for direct
  manipulation and immediate feedback as media for understanding.
- **distill.pub** — research articles published as interactive web pages.
  The proof that a peer-reviewable scientific artifact can be a static HTML
  bundle with no backend.
- **Bartosz Ciechanowski** (`ciechanow.ski`) — long-form interactive essays
  that double as the gold standard for static-bundle craft.
- **Nicky Case** (`ncase.me`) — *Explorable Explanations* and the design
  patterns essay. Cataloguing the moves we use without naming them.

And the *frozen-snapshot* tradition that gives the artifact its other half:

- Gate-review decks and gate documents (the snapshot a reviewer gets in
  advance of a meeting).
- Manuscript supplements published alongside a paper — pre-rendered figures,
  static demos, no live server.
- Engineering design reviews and post-mortems handed off in PDF or HTML.

[`sandbox-design.md`](sandbox-design.md) governs the *sandbox* layer of
these artifacts. Read it before designing the next sandbox.
[`sandbox-engine.md`](sandbox-engine.md) is its implementation companion.

---

## 3. What a dashboard is for

Three jobs, in priority order:

1. **Teach the project to a new reader.** The artifact should answer the
   first ten questions a new collaborator would ask, in the order they would
   ask them. Tabs are the table of contents.
2. **Freeze a snapshot for a specific audience.** Every artifact targets a
   named audience (a gate reviewer, the manuscript reader, the team's next
   hire) on a named date. The artifact is shaped by who it's for.
3. **Organize what was tried.** Including what didn't work. Sortable tables
   of experiments, small-multiples grids of conditions, and curated figure
   galleries are first-class content; they sit on the page, not in an
   appendix.

A dashboard that does only #1 is a tutorial. A dashboard that does only #2
is a slide deck. A dashboard that does only #3 is a lab notebook. We want
all three.

---

## 4. The principles

A working list, in priority order. Each one is something we have or could
have applied across `ads`, `dbp`, or `sim`.

1. **The artifact is `index.html` on a USB stick.** Static, single-file
   build, no backend, no runtime network. If it doesn't open from `file://`
   by double-click, the build is broken. Verify before claiming done.
2. **Hash routing, never history API.** Required for `file://`. URLs
   deep-link to tabs and filtered views; they are not a state store.
3. **The dashboard is a snapshot, not a feed.** It freezes a moment in the
   project for a specific audience (gate review, manuscript, handoff).
   Design for "this is what we knew on date X," not for live data.
4. **Tabs are chapters.** Each tab teaches one part of the project. Order
   is reading order. A tab whose name doesn't survive "what does this
   teach?" needs to be split or merged.
5. **One concept per page.** If you can't write the page lede in one
   sentence, it's two pages. (Doc 13 rule 1, one layer up.)
6. **A page is an essay; a sandbox is a paragraph.** Sandboxes don't stand
   alone. Page narrative supplies *why*; the sim supplies *how*. Captions
   go in early — they discipline the design. (See
   [`sandbox-design.md`](sandbox-design.md) for the sandbox-layer rules.)
7. **Experiments and conditions are first-class content.** What was tried
   — including what didn't work — teaches the project. A sortable table
   or small-multiples grid of the design space lives on the page, not in
   an appendix.
8. **Default to running.** First frame is alive. Sandboxes, plots, 3D
   viewers — all interacting on first paint. No splash screens, no "Click
   to start." (Lift of `sandbox-design.md` rule 2.)
9. **Data is content; content is TypeScript.** Static data lives as TS
   objects in `src/data/`. Not MDX, not JSON fetched at runtime. The type
   system catches schema drift; data sits next to the components that
   render it. Python-generated payloads become typed TS files, not loose
   JSON.
10. **Tuning lives in code, not UI.** Surface 1–3 controls per sandbox —
    each one teaches a concept. The other ~40 knobs stay in the source.
    (Lift of `sandbox-design.md` rule 3.)
11. **Names are the box.** Tab names, sim names, the dashboard's own name
    prime the reader. Prefer concrete and slightly playful over taxonomic.
    Rename early; it's cheap before the artifact is in someone's inbox.
12. **Aesthetic warmth is not a luxury.** Soft palette, generous
    whitespace, eased motion, dark/light tokens. Instrument-panel UI
    signals "work"; we want "explore." (Lift of `sandbox-design.md`
    rule 11.)
13. **The build is the deliverable.** A green test suite isn't enough.
    Open the bundled `dashboard/index.html` from `file://` in a real
    browser before claiming done. The dev server has a real origin and
    won't catch the regressions that matter.
14. **A theme isn't a theme until it reaches the bottom.** Toggling
    `data-theme` on `<html>` is necessary, not sufficient. Sandboxes,
    charts, 3D scenes, SVGs, and bundled images all read from the same
    token set, or they leak. Common failure modes: transparent PNGs with
    baked-in light backgrounds; SVGs with hard-coded fills; Plotly
    layouts with default white paper; r3f scenes that read background
    once at mount. Test by toggling the theme on every page and watching
    for the flash.
15. **Fork before refactor when the old artifact must keep running.**
    When a tab is being rebuilt and a stakeholder review is pending,
    copy the file rather than refactor in place. The old artifact keeps
    driving the live demo while the new one ramps up; they diverge
    without one breaking the other. Pay the duplicated-maintenance cost
    until cutover. Worked example: `src/placement/sandboxEngine.tsx` was
    forked to `src/sandbox/engine.ts` so `/placement` kept working while
    `/sandbox` was built.

Three of the principles (8, 10, 12) are direct lifts from
`sandbox-design.md`'s sandbox-level rules. They are restated at the
dashboard level on purpose so this doc reads stand-alone — someone
scaffolding a new dashboard doesn't have to find `sandbox-design.md` to
start. Each lift credits its source.

---

## 5. Composition with the sandbox docs

Three layers, written down so the docs don't drift.

- **[`principles.md`](principles.md)** (this doc) governs the *dashboard*
  layer: deployment, information architecture, what tabs are for, how data
  is authored, theme propagation.
- **[`sandbox-design.md`](sandbox-design.md)** governs the *sandbox*
  layer: how a single sim is designed, time scrubbing, visual idioms,
  controls budget, cartoons over fidelity.
- **[`sandbox-engine.md`](sandbox-engine.md)** governs the *implementation*
  of sandbox engines: two-clock discipline, single-state
  multiple-renderers, fork seam.

**Composition rule.** Sandboxes nest inside pages; pages nest inside the
dashboard. When a dashboard rule and a sandbox rule conflict (rare), the
dashboard rule wins — the artifact has to ship and be themed before any sim
inside it can be enjoyed.

Three of the principles in §4 (8, 10, 12) are direct lifts from
`sandbox-design.md`. They are restated at the dashboard level so this doc
reads stand-alone.

---

## 6. Process

### Scaffold from `dash`

```bash
git clone nuc:code/dash.git my-project
cd my-project
git remote rename origin upstream
git remote add origin nuc:code/my-project.git
nvm use   # or use Homebrew Node 22 path
npm install
npm run dev
```

Rename in `package.json` and `index.html` `<title>`. Replace the project
name in `AppLayout`. First commit on the new repo.

### Add a tab

1. Create `src/data/<topic>.ts` with the typed content for the tab.
2. Create `src/routes/<TopicPage>.tsx` that renders the data.
3. Add the route to `src/App.tsx`.
4. Add the entry to the `TABS` array in `AppLayout.tsx`.
5. Verify on `file://` (open the bundled HTML) and toggle the theme.

### Add a sandbox

Read [`sandbox-design.md`](sandbox-design.md) first. Then:

1. Decide what concept the sandbox teaches (one sentence, see
   `sandbox-design.md` rule 1).
2. If a similar engine already exists in another project, fork it
   (principle 15) — don't refactor the source repo's engine in place
   while a stakeholder review is pending.
3. Implement following `sandbox-design.md` §6 ("Process: how to build the
   next one").

### Organize experiments and conditions

Per principle 7, what was tried is first-class content. Two patterns we use:

- **Experiments tab** — a sortable table of designs × parameters × outcomes
  (one row per condition tried). Filter by outcome class.
- **Conditions tab** — a small-multiples grid of the parameter sweep, with
  outcome encoded in colour or saturation.

### Cross-tab integration seams

When two tabs share data, put the mapping in one typed file named after the
*consumer* side. Easier to find later than three scattered transformations.
Worked example in `ads`: `src/sandbox/origami/descriptor.ts` is the single
boundary between `/designs` and `/sandbox`. The same shape fits
`/chips` → `/sandbox` (`placementCartoonFor`) and would fit
`/sandbox` → `/origami` if the flow reverses.

---

## 7. Open questions

- **An upgrade story.** When `dash` itself bumps deps, what's the migration
  path for downstream projects? Today: docs only. If we end up with three
  or more downstream projects sharing the same surface, revisit publishing
  `dash` as a private package.
- **A theme-leak detector.** Worth a one-shot script that visits each tab
  in headless Chromium with each theme set and screenshot-diffs for
  unexpected color regions? Probably overkill until leaks become recurring.
- **Touch / mobile.** Most dashboards in this lineage are desktop-tuned;
  a fraction of reviewers will pull them up on a tablet. Worth one round
  of touch testing per shipped artifact.
- **Print stylesheet.** Reviewers sometimes print the dashboard. Worth a
  one-page print stylesheet that hides interactive widgets and lays out
  the static prose cleanly?

---

## References

- [`sandbox-design.md`](sandbox-design.md) — the sandbox-design playbook.
- [`sandbox-engine.md`](sandbox-engine.md) — the sandbox-implementation
  companion.
- [`recipe.md`](recipe.md) — the build/runtime guide.
- Bret Victor, *Inventing on Principle*. http://worrydream.com/InventingOnPrinciple/
- distill.pub — *Research interactive papers*. https://distill.pub/
- Bartosz Ciechanowski. https://ciechanow.ski/
- Nicky Case, *Explorable Explanations: 4 More Design Patterns*.
  https://blog.ncase.me/explorable-explanations-4-more-design-patterns/
