# Native sample/species editing

Reference: 5f51097 GelView::openSampleView/newFragmentAtPos, SampleView::newFragment/keyDown/mouseDown, Sample::cloneFragment/removeFragment, MolecularSim::deleteFragment.

- [x] Add empty-sample creation, native new-species generator and add-button/right-click paths.
- [x] Append duplicates, use native swap-with-last deletion, repair affected selection/rollover and molecular particle indices.
- [x] Restore sample keyboard Delete/Backspace/Escape/Tab (including no-species step), background toggle and dye inspector routing.
- [x] New tube selection shows sample alone; sample background toggles Buffer + Dyes. Native palette values are channel/255, not gamma-decoded.
- [x] Test model invariants and real create/edit/clone/delete/save sequences on both GPU backends; verify suite and build.

Boundary: runtime random sequence need not match a different randomly seeded native process; generator distribution/defaults match native. Stable cross-loupe ancestry, full drag fidelity, particle timing and native numerical certification remain separate roadmap requirements.

Verification: 319 unit tests, 144 browser tests (WebGPU + WebGL2), production build including TypeScript pass. No goldens changed. Fresh review findings resolved with failing-then-passing tests: Delete follows validated visible shared selection after unrelated sample move/clone; selected gel outline uses native raw RGB. Full sample identity migration remains open. Native GUI replay is pending because the running reference app exposed no window during this increment.
