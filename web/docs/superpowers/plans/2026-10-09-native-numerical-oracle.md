# Native numerical reference executable

Goal: P0/P3 independent numerical evidence from unmodified pinned GelSim.cpp, not a second translation. Use isolated source extraction at5f51097 and available Cinder build f90f332d1a4d453282c76435f3401271f25922f9. Record library/compiler/source hashes and compatibility headers. Do not modify sibling checkouts. Modern Cinder means this is a pinned model reference, not certification against the shipped native binary.

- [x] Compile and execute source-isolated C++ harness with pinned GelSim/Sample types and effective tuning.
- [x] Export deterministic cases covering startup, buffers, voltage/time, degradation, masses, aspects, aggregate distributions and dyes, with all band outputs.
- [x] Compare web fragToBands numerically to recorded C++ outputs. Classify mismatches, correct native-model divergences with regression checks, and document tolerances/limits.
- [x] Verify reproducibility and provenance, run full tests/build after any model correction, fresh review and status record.

Result:259 native cases pass. Three model divergences corrected; review's fractional float32 discontinuities corrected. Finite integer seed guards tested RED->GREEN. Source/input/output/harness hashes verified; native output byte-repeatability verified.595unit/158browser/build pass; no snapshot changes. Scope and tolerance limits in reference/native/numerical/README.md; full parity gates remain open.
