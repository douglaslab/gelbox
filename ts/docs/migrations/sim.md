# sim → dash project/manuscript dashboard plan

A *new* static project/manuscript dashboard for sim, separate from the
existing FastAPI tools (`dashboard_archived/`, `figures/dashboard/`,
`align_viewer/`). Those keep their backend — they're operational. This
dashboard is an artifact: a frozen snapshot for teaching the sim project
to a new reader and organizing what was tried.

Estimate: ~1 week to first milestone, more as content gets authored.

## 1. Why a separate dashboard

The FastAPI tools poll SLURM, dispatch jobs, and accept POSTs. They can't
run from `file://` and they shouldn't try. The artifact dashboard reads
only static data (cold JSON from finished sweeps) and renders. Different
audience, different lifecycle. The two co-exist: the FastAPI tools serve
the team day-to-day; the artifact serves a frozen snapshot to readers.

## 2. Audience

A new collaborator joining the sim project, or a reviewer reading the
manuscript. They should be able to grasp the model, the pipeline, and
the design space we've explored within ~30 minutes of poking. Not the
oncall sim engineer (they use the FastAPI tools).

## 3. Information architecture

Seven tabs, in reading order.

> **Overview.** What CG3B is, what we're trying to validate, and one
> figure showing the pipeline end-to-end. The reader should be able to
> close the tab after 5 minutes with a working answer to "what does this
> project do?" Sandboxes here are tempting but discouraged — Overview is
> orientation, not interaction.

> **Model.** The bead model, the rigid-body and CG3B stages, the RMSD
> metric. One sandbox here is high-leverage: a toy version of the
> integrator on a small system, showing how rigid-body propagation feeds
> CG3B and how RMSD evolves as a function of the parameters under test.
> Read [`../sandbox-design.md`](../sandbox-design.md) before designing it.

> **Pipeline.** RB → CG3B → analysis flow with per-stage inputs and
> outputs. A static diagram with click-through into per-stage detail
> panels is enough; no sim required. The reader leaves understanding
> what file types live at each boundary.

> **Experiments.** First-class content per `principles.md` rule 7. A
> sortable table of designs × parameters × outcomes — one row per
> condition tried — with live filter on outcome class (passed,
> regressed, abandoned). The table is the experiment record; what
> didn't work belongs here.

> **Conditions.** The design space dimensions: parameters, ranges, what
> was screened. Small-multiples grid encoding the sweep, with outcome
> in colour. Distinct from Experiments — Experiments lists *what was
> run*; Conditions visualises *the parameter geometry of what was run*.

> **Figures.** A curated subset of the figures from
> `~/code/sim/figures/dashboard/`, frozen as a static gallery. The live
> tool stays for working browse; this is the publication-track subset.
> Reuse the carousel/zoom UI pattern but reimplement in React + Tailwind.

> **Manuscript.** Section/figure/gate tracker, mirroring dbp's Manuscript
> tab. Reads from a per-section status file and lists which figures and
> gates each section depends on.

## 4. Data pipeline

A Python step (probably `tools/build_artifact_dashboard.py`) reads from
`/data/sim/results/` and emits typed TS files into the artifact's
`src/data/`. Runs offline; the artifact ships the frozen output. No
runtime fetch.

## 5. What carries over from `figures/dashboard/`

The figure metadata schema (zone × design × figure-type taxonomy), the
carousel pattern, the lazy-load + zoom-overlay UI. Reimplemented in
React + Tailwind, not literally ported. The vanilla JS is too small to
be worth a wrapper.

## 6. What does not carry over

SLURM polling, BO campaign tracker, settings inspector, allocation
browser, accept-render endpoint. Those are operational tools and stay
in their FastAPI homes.

## 7. First milestone

Scaffold from `dash` (clone, rename, push to nuc as `nuc:code/sim-artifact.git`
or similar). Ship Overview, Pipeline, and Experiments tabs with real
sweep data. Manuscript and Figures tabs follow once the schema is
stable. The Model sandbox is a separate sub-project.

## 8. Estimate

~1 week to first milestone (Overview + Pipeline + Experiments). Other
tabs add 2–3 days each as content gets authored.

## References

- `dash/docs/principles.md` — apply on every tab.
- `dash/docs/recipe.md` — the build setup.
- `~/code/sim/figures/dashboard/` — source for the Figures tab carousel.
- `~/code/sim/README.md` — source for Overview / Model prose.
- [`../sandbox-design.md`](../sandbox-design.md) — read before adding the
  Model tab's sandbox.
- [`../sandbox-engine.md`](../sandbox-engine.md) — if the Model sandbox
  warrants an engine.
