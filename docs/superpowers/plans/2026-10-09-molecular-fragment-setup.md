# Native molecular fragment setup

Authority5f51097 MolecularSim::setSample, calcTargetPop, basesToRadius, effective molecular-sim.json, Aggregate::top. Extract those functions and tuning loader into independent C++ adapter. Compare default/filtered per-fragment outputs including synthetic loupe samples.

Restore effective population exponent1, unclamped float32 radius mapping, aspect geometry, separate wholeness endpoints, native integer filter demodulation by first maximum-weight tier (not vector length), interpolation without extra clamp and radiusMin/r floor. This replaces deliberately approximate web wholeness/filter behavior. Particle lifecycle/RNG/motion and complete renderer remain subsequent scope.

- [x] Capture native fragment setup and filtered cases; differential tests fail before changes.
- [x] Port setup arithmetic/tuning and correct obsolete expectations; inspect any image changes.
- [x] Full validation and fresh review; document evidence and commit.
