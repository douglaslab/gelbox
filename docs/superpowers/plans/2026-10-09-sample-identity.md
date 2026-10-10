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

- [ ] Write identity reducer regressions for edit history, off-document move/reentry, clone separation, swap-delete/reappend, stale rollover, replacement, and frame focus. Run targeted Vitest; expect failures against lane-based implementation.
- [ ] Implement sample identity and update all real UI producers/consumers. Preserve raw external indices; only keyboard-selected deletion deselects. Refresh retained references on immutable edits. Derive compatibility panel selection fields from authoritative reference.
- [ ] Add browser workflows for clone/frame focus, off-document removal and stale highlights/replacement; observe RED before final integration or use a deliberate old-behavior mutation for the integration boundary.
- [ ] Run targeted units/browser cases then full units, build/typecheck and both backend browser suites. Expected all pass; no baseline refresh without explained visual behavior.
- [ ] Update evidence/scope, commit, complete task with full unit suite. Fresh read-only review; one RED→GREEN fix pass for important findings.

Native tick source corrects the earlier STATUS inference: clone panel follows the original shared selection on the next tick. Record this correction, not a permanent clone-panel change.
