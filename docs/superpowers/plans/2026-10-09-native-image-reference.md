# Native image interaction reference

> Use superpowers:executing-plans for this reference increment.

**Goal:** Capture native image drag, resize, handle, focus and removal rules before implementing reference images in the web app.
**Spec:** docs/ROADMAP.md P0/P4; native `5f51097` ImageView methods are authority.
**Architecture:** Extract methods unchanged from Git objects. Use real pinned Cinder rectangle/vector math and minimal event, texture-size and view-storage adapters. No GUI or product changes. Record inputs, outputs and provenance; independently assert important observations.

## Global Constraints

- Existing isolated worktree only; do not modify native/Cinder checkouts.
- Record modern Cinder/toolchain limitations; no native pixel or decoder claims.
- Existing user authorization covers parity reference work; this is implementation evidence for the agreed roadmap, not a new product design.
- Previous goal turn was progress: reviewed hidden-sample keyboard fix committed.

## Review Focus

- Clamp-before-aspect may produce a dimension below 32: test landscape/portrait.
- Native snap uses Euclidean distance and a strict threshold: cover either side.
- Window-edge contact counts as intersection: test contact and one pixel outside.
- Event adapters must not quietly implement the algorithm under test: extract five entire native methods and use Cinder geometry.
- Input/provenance drift must fail contract checks; verify deterministic rebuild and mutation sensitivity.

### Task 1: Capture image gesture contracts

**Files:** reference/native/numerical/{build-image.py,image-driver.cpp,image-cases.json,image-outputs.json,image-provenance.json,test_image.py,README.md}; docs/STATUS.md.
**Interfaces:** JSON input contains id, natural size, initial frame, mouse-down, movement sequence, window bounds and optional key. Output contains id, resulting frame, handle box, focus-call count and removed flag.

- [ ] Write Python contracts with explicit expected observations for resize/aspect/minimum, snap, drag/reentry, handle edges, deletion and window intersection. Run `python3 reference/native/numerical/test_image.py`; expect missing capture failures.
- [ ] Extract mouseDown/mouseDrag/mouseUp/keyDown/calcResizeBox byte-for-byte. Build against pinned clean Cinder with adapters for view storage/event positions/texture dimensions. Record full source, extraction, driver, input/output, compiler, library and executable hashes. Run executable twice; require identical outputs.
- [ ] Run `python3 reference/native/numerical/build-image.py` then contract tests. Expected deterministic capture and all contracts pass. Temporarily alter a resize output and update its digest; explicit expected-value assertions must still reject it; restore exact artifacts.
- [ ] Document source-backed application behavior separately: insertion/focus does not raise existing images; loupes explicitly raise; gel replacement retains images; saves exclude them; resize callback does nothing. Native drop extensions are exactly lowercase .jpg/.png/.gif and picker filters JSON/XML. Decoder first-frame behavior is not yet certified.
- [ ] Commit and task-done with contract tests, then one fresh read-only review and one fix pass if needed. No product regression suite required for reference-only changes.
