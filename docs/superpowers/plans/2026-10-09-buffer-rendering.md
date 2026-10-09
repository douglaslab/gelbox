# Running-buffer rendering integration

Goal: apply native global H2O effects through the real gel settings UI on both backends.

Reference: pinned Gel.cpp::getRenderGlobalWarp uses exact H2O buffer equality and seed 1. Existing renderers implement faintness and overcook; GelCanvas currently omits setGlobalWarp.

- [x] Add a real-browser differential check: the app after selecting H2O must match the independently wired dev renderer for identical bands and native global settings. Check switching back to TBE too. This certifies integration, not native pixel equivalence.
- [x] Pass memoized global warp from running buffer to GelCanvas; apply latest bands and warp during async setup and updates.
- [x] Run both backend checks, regression suite, typecheck/build; record remaining native fidelity limitations.
