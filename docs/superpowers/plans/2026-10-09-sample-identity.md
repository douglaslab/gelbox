# Sample identity migration implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make shared selection and rollover retain native sample identity across immutable edits, lane moves, clones, removal and raw fragment-index changes.

**Architecture:** Keep plain sample arrays and pure numerical inputs. A WeakMap associates immutable versions of a sample with one transient identity token; explicit sample-update helpers preserve that token, while clones/imported objects have distinct identities. Shared references retain the sample snapshot and raw index, and the reducer refreshes snapshots from current document/drag versions. View ownership stays separate from shared selection; a frame action mirrors native GelView::tick selection-following.

**Tech Stack:** TypeScript, React, Vitest, Playwright, Node 22.

**Spec:** docs/ROADMAP.md and reference/native/numerical/identity-outputs.json; pinned native Sample/GelView/SampleView methods are authority.

## Global Constraints

- Work only in isolated worktree; native `5f51097` read via Git objects.
- Strict native behavior first; no stable species identity or serialized runtime IDs.
- Keep native JSON schema and numerical algorithms unchanged.
- Preserve immutable historical reducer states; identity must not mutate old sample data.
- Run Node 22; stop browser servers before source edits.

## Review Focus

- Stale callbacks from loupes/document replacement must not select a different sample occupying the same lane.
- Off-document selection owns its sample; no permanent global strong-reference registry.
- Edits preserve identity, clones do not; same serialized IDs are distinct.
- Raw invalid indices survive compaction; keyboard Delete clears selection first.
- Pointer-event panel changes versus next-frame selection following; closing/opening and hidden lanes.

### Task 1: Migrate shared references and consumers

**Files:** ts/src/lib/gel/{sampleFragRef,gelState,sampleKeyboard}.ts; gel/sample/inspector components; new unit and browser identity tests; existing tests whose expectations encode old lane identity; docs/STATUS.md.

**Interfaces:** SampleFragRef becomes `{sample: Sample, fragmentIndex: number|null}`; actions constructing references supply actual samples. `reviseSample` preserves transient identity across immutable data versions. `sameSample`, validity and index helpers centralize comparisons. `SYNC_SELECTION_VIEW` performs native selection-following once per frame.

- [x] Write identity reducer regressions for edit history, off-document move/reentry, clone separation, swap-delete/reappend, stale rollover, replacement, and frame focus. Run targeted Vitest; expect failures against lane-based implementation.
- [x] Implement sample identity and update all real UI producers/consumers. Preserve raw external indices; only keyboard-selected deletion deselects. Refresh retained references on immutable edits. Derive compatibility panel selection fields from authoritative reference.
- [x] Add browser workflows for clone/frame focus, off-document removal and stale highlights/replacement; observe RED before final integration or use a deliberate old-behavior mutation for the integration boundary.
- [x] Run targeted units/browser cases then full units, build/typecheck and both backend browser suites. Expected all pass; no baseline refresh without explained visual behavior.
- [x] Update evidence/scope, commit, complete task with full unit suite. Fresh read-only review; one RED→GREEN fix pass for important findings.

Native tick source corrects the earlier STATUS inference: clone panel follows the original shared selection on the next tick. Record this correction, not a permanent clone-panel change.

## Reviewed outcome

Implementation: `25e3fa2`, followed by the hidden-lane Tab review correction.
Independent review found no introduced defects; an existing visibility guard was
promoted to a parity fix. NEXT/PREV regressions failed before removal and pass
with panel-owned cycling. Final verification: 2,763 units, 227 browser tests plus
one intentional duplicate skip, production build/typecheck; no snapshot changes.

Decisions carried forward:
- Preserve native event/frame selection-following, including returning to the
  original sample after Alt-clone. A wrong phase model would change panel focus.
- Weak identity tokens connect immutable revisions without serialized IDs or a
  strong global registry. Any future sample mutation must preserve identity or
  explicitly create a new sample; otherwise cross-view references can go stale.
- Ordinary synchronous lane-targeted commands remain; retained loupe callbacks
  use sample references. Future asynchronous editing needs a fresh stale-target audit.
- General nested/cyclic ancestry has no demonstrated current UI path; this
  increment does not certify it. If introduced, source resolution needs new proof.
- Full native GUI timing/focus, shared RNG, raster and release gates remain open;
  local passing tests must not be interpreted as full parity certification.

No deferred minor findings. The isolated development worktree remains in use for
the active complete-web-app goal; integration/publication is not this increment.
