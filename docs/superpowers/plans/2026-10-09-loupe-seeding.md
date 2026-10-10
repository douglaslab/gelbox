# Native loupe seeding and refresh

Contract: docs/ROADMAP.md strict native parity, approved web-first strategy. Restore existing behavior from GelView::updateGelDetailViewContent and MolecularSim::setRand at pinned 5f51097. Native detail seed uses float anchor x*19+y*1723 plus truncated float gelTime*2393. setRand copies the stream, then takes population seed from its by-value argument; the dynamic stream remains unconsumed. Refresh clears particles and reseeds the existing engine before sample/preroll, preserving independent global angular RNG state.

- [x] Capture native expression and inline setRand, exercise fractional coordinates/time and repeated refresh.
- [x] Observe differential failures, implement seed calculation and engine reseed, wire actual loupe.
- [x] Verify unit/browser/build, inspect changed snapshots, one fresh review, record limitations and commit.

No native visual certification claim. Ordinary-view identity, global application RNG initialization and full loupe gestures remain required separate work. Existing native harness uses modern Cinder/ARM64; record provenance. Invalid float-to-unsigned seed conversions outside native finite representable range are not an oracle.

Evidence: docs/STATUS.md “Native loupe seed derivation and refresh.” Fresh review coverage finding addressed with eight low-mass cases and a failing raw-seed mutation; final 2,594 unit / 188 browser / build checks pass.
