# Native combined workload measurement plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline.

**Goal:** Compare the existing compiled web 50-band/sample/three-loupe workload with pinned native Gelbox on this Mac, then derive a measured release budget.

**Architecture:** Instrument a freshly reconstructed compatibility reference only. Load the identical file through native loading, open views through native event handlers, and observe steady frame intervals and update/draw CPU elapsed time. Retain raw samples and provenance; do not equate CPU submission time with GPU completion.

**Tech Stack:** C++/Cinder, Python instrumentation, existing Playwright performance runner.

**Spec:** `docs/ROADMAP.md`, P5 workload measurement requirement.

## Global constraints

- Native source remains pinned to `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`; record modern Cinder compatibility provenance.
- Use `reference/web/performance/five-ladders.gel.json`, 1365×768 client area, DPR2, effects enabled, one sample and three loupes anchored at bands0/5/9.
- Preserve native timestep, random behavior, renderer and normal view updates.
- No product modifications, pushes or deployment in this increment.

## Review focus

- Reject captures with wrong document band count, missing views, no live particles, wrong scale or effects disabled.
- Ignore draw callbacks before initialized application updates.
- Separate steady cadence from CPU elapsed time and input-to-photon latency.
- Record stochastic particle counts rather than assuming native/web populations match at one wall-clock time.
- Keep instrumentation, source/build hashes, hardware, timings and limitations reproducible.

## Task1: Native measurement

- [x] Reconstruct the recorded reference into a fresh isolated build and verify source hashes.
- [x] Add `reference/native/modern/performance/instrument.py` plus `probe.inc`; hash-check original files before patching, count updates, observe update/draw times, load fixture and open required views, fail workload guards, retain raw samples and snapshots.
- [x] Build and execute the probe twice. Confirm matching workload and useful sample counts; inspect distributions before proposing any threshold.
- [x] Retain provenance and results with explicit compatibility-reference limitations.

## Task2: Comparable web measurements and budget

- [x] Rerun compiled web workload on the same hardware and record matching scenario, resource scope and viewport.
- [x] Compare steady cadence, callback/update/draw time, interaction responsiveness and resource growth, identifying measurements that are not directly comparable.
- [x] Derive a hardware-specific repeatable regression budget from observed variability; keep input-to-photon and driver-memory claims out unless measured.
- [x] Independent review, verification, status/roadmap update and local commit. Full release acceptance stays open for other requirements.

Observed limitation: a preliminary native gesture capture failed its final view
retention guard; diagnostic and two final runs passed. Cause remains unresolved.
The measurement/budget deliverables are implemented; this does not close the
whole release or certify unattended native capture reliability.
