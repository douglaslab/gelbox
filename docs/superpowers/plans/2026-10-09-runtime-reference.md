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
- [ ] Commit `test: capture native shared runtime sequences` and run the task contract. Obtain one fresh read-only review; address Important findings with regression tests.

## Decisions

- Continue inline under the existing goal and parity authorization; no additional permission gate for local reference work.
- This is prerequisite evidence for the runtime correction, not a reduced definition of app completion.
- Self-review: one task, no cross-task interfaces; each listed risk has an explicit contract above.
