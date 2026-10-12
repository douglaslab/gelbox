# Independent native particle lifecycle

Extract pinned native particle declaration, randomPart, weighted aggregate selection, tick, bounds and preroll verbatim behind the existing storage adapter. Capture seeded spawning and multi-tick lifecycle scenarios with real Cinder RNG and explicit global seed. Compare every particle field and order. Cover normal/bullet time, bounds/density, degradation, multimers, dyes and mass edits. Preserve provenance and the modern-Cinder versus shipped-binary limitation.

- [x] Extend the C++ reference and capture deterministic particle fixtures.
- [x] Reproduce web mismatches and restore native RNG/spawn/lifecycle semantics against that reference.
- [x] Full validation, image inspection, fresh review, evidence and commit.

Scope excludes mesh generation and browser/application seed/identity lifecycle; those remain required roadmap work.
