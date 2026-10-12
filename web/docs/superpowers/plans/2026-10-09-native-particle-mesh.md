# Native particle mesh geometry

Strict native behavior/visual parity under docs/ROADMAP.md. Extend independent numerical capture with native mesh generation, original Cinder0.9.0 PolyLine and its pinned Boost dependency. Preserve source hashes and state modern math/library limitations. Compare triangle coverage, bounds, centroid, color and pass order over degradation, outlines and multimers; different equivalent triangulation/order is acceptable only if coverage matches. Correct unsupported degradation floor and clipping/centroid arithmetic. Mesh output must remain usable through both GPU backends.

- [x] Capture deterministic independent native mesh cases and demonstrate current differences.
- [x] Restore native clipping, centroid, transforms and outline behavior.
- [x] Full validation, inspect changed images, fresh review, evidence and commit.
