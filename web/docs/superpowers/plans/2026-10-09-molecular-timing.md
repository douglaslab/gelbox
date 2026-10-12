# Native molecular timing and initialization

Authority: native 5f51097 MolecularSim::tick/preroll, SampleView::tick, GelView::updateSampleView and makeLoupe. Preserve native boolean bullet-time scaling while leaving fade rates independent. Sample panels start with normal particle fade-in (native preroll is disabled); loupes preroll 100 ticks when their synthetic sample changes. Editing ordinary sample data does not advance the engine out of band. Keep particle RNG, spawn/motion formulas and full identity migration as explicit remaining roadmap work.

- [x] Add failing source-backed timing and real-browser initialization/hover tests.
- [x] Restore boolean tick API, native preroll timing, and sample/loupe initialization wiring.
- [x] Inspect affected images, run full checks, obtain fresh review and record evidence.

Review corrections: preserve held-pointer timing through leave until global release/cancel; rebuild detail particle state before every synthetic-content preroll. Native RNG and complete seed derivation remain explicit subsequent work.
