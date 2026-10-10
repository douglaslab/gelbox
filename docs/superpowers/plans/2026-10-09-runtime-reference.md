# Shared Runtime Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Establish independently compiled expectations for native random streams and ordered molecular-view sequences before correcting the web application runtime.

**Architecture:** Extract the native molecular constructor/engine, species generator, palette selection and ViewCollection tick unchanged. Small adapters provide view ownership, sample data and scripted events; captures explicitly distinguish those scripts from native GUI orchestration. Keep the existing numerical reference artifacts and product unchanged in this increment.

**Tech Stack:** Python unittest/build tooling, C++20, pinned Gelbox and Cinder on macOS.

**Spec:** `reference/native/runtime/README.md`; completion scope remains `docs/ROADMAP.md`.

## Global Constraints

- Strict native behavior and visual parity first; improvements afterward.
- Finish the web app first; reconsider Rust/native only for a concrete need.
- Read native source only from `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`.
- Use clean Cinder `f90f332d1a4d453282c76435f3401271f25922f9`; record compiler, library, source, extraction, input and output hashes.
- No native checkout changes; no overwriting existing numerical captures.
- A headless scripted capture does not certify original executable, GUI event ordering or raster parity.

## Review Focus

- Negative palette integers: preserve 64-bit unsigned size modulo.
- Hidden random draws: zero aspect/multimer chances and inspector initial values still consume RNG.
- Loupe reset: constructor draws occur before local reseeding; preroll consumes global particle draws.
- View mutation during ticks: insertion waits; removal skips destroyed objects but retained removed objects still tick.
- Harness drift: preserve extracted method bodies and pin reused adapters; output regeneration must not silently redefine source expectations.

### Task 1: Reproducible composed native reference

**Files:**
- Create `reference/native/runtime/build.py`, `driver.cpp`, `cases.json`, `outputs.json`, `provenance.json`, `test_runtime.py`.
- Modify `reference/native/runtime/README.md`, `docs/STATUS.md`.

**Interfaces:**
- Consumes pinned native source and existing `reference/native/numerical/molecular-adapter.h` storage declarations (scratch constructor declaration only).
- Produces `outputs.json`: case ID, per-step ordered views with molecular/local seeds, generated fragments and particle fields, notification log, tick trace, and terminal global RNG integer.
- `build.py --build <scratch-dir>` builds and captures twice identically; writes only runtime outputs/provenance. Cases specify initial global seed, sample, and ordered operations.

- [x] Write `test_runtime.py` with literal initial seeds from the probe, inspector/no-inspector differences, six-draw species stream checks, signed palette modulo, loupe reseed/preroll, shared global tick ordering, snapshot insertion/removal/lifetime behavior, source/extraction/provenance integrity and required scenario coverage.
- [x] Run `python3 -m unittest discover -s reference/native/runtime -p 'test_*.py'`; expect missing composed outputs before implementation.
- [x] Implement extraction/build, driver adapters and explicit cases. Extract the constructor, complete `newFragment`, complete palette method and complete `ViewCollection::tick`; label setup/inspector statement extraction and scripted event callbacks. Use original sample fields and particle algorithms; inspect generated captures without treating them as automatic truth.
- [x] Run `python3 reference/native/runtime/build.py --build /tmp/gel-native-runtime` and the unittest command; expect deterministic capture and all contracts passing. Add or correct assertions only from source/independent checks, not merely generated values.
- [ ] Validate original source/extraction pins, byte-identical repeated output, unchanged existing numerical artifacts, and `git diff --check`. Document limitations and next runtime integration work.
- [x] Commit `test: capture native shared runtime sequences` and run the task contract. Obtain one fresh read-only review; address Important findings with regression tests.

## Decisions

- Continue inline under the existing goal and parity authorization; no additional permission gate for local reference work.
- This is prerequisite evidence for the runtime correction, not a reduced definition of app completion.
- Self-review: one task, no cross-task interfaces; each listed risk has an explicit contract above.

## Verification and review

Implemented in `2b8dbf9`; 16 scenarios captured twice identically and 8/8 Python contracts pass. A further fresh executable run matched, and the independent reviewer repeated two more executions with identical output. Twenty native source hashes, extracted blocks, generated includes, Cinder/library/executable hashes and diff cleanliness were verified. Existing numerical artifacts and product code are unchanged. The initially missing-output tests failed before capture; stale provenance and a missing composed edit scenario were also rejected before regeneration.

Fresh read-only Astra review found no Critical, Important or Minor findings. No fix pass or deferred minors. Retain this worktree for continued web parity implementation; no merge, push or publication.

Rulings carried from execution and review:

1. Continue inline under existing goal authorization for reversible local reference work. Cost if wrong: revise this reference increment; no product behavior changed.
2. Correct the paused-age test: native `randomPart` assigns a random initial age even when time scale is zero. Require ages to match after identical reseeding, rather than equal zero. Cost if wrong: a paused lifetime mismatch could be overlooked; the source assignment and full particle capture remain available.
3. Native GUI event ordering, focus and panel lifecycle remain unverified by scripted adapters. Cost of treating this as complete would be incorrect application command ordering; require subsequent GUI replay.
4. Original executable/raster equivalence remains unverified by modern Cinder/headless execution. Cost of overclaiming would be an unsupported visual parity declaration; retain the full native visual gate.
5. Band-to-loupe extraction and degradation filtering remain under the existing independent numerical reference, unchanged here. Cost if these layers compose differently is a missed interaction; verify composed GUI/runtime behavior later.
6. Web runtime integration, StrictMode and delayed GPU initialization remain required next implementation work. Cost if omitted: the confirmed runtime ordering mismatch persists despite the new reference passing.
7. Other P0–P5 gates remain open. Cost of closing them from this increment would be premature app completion; the active goal remains unchanged.
