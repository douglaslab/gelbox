# Native CPU warp fields

Contract: docs/ROADMAP.md strict native behavior/visual parity; build on e4907f3. Restore the active pinned GelRender smile, well-damage and overcook control generation without changing source siblings.

- [x] Extract native makeWarpByFracPos/smileBand/wellDamageBand/active overcook verbatim into a minimal Surface capture adapter. Capture twice with provenance, positive/disabled effects, seeds, fractional geometry, resolutions and distortion levels.
- [x] Add exact differential byte/dimension/scale tests; observe failures. Restore Cinder RNG, float evaluation, uint8 truncation and native output resolution in both renderer call sites.
- [x] Run full unit/build/browser checks, inspect changed web snapshots, obtain one fresh review, record limits and commit.

Review focus: native expression evaluation order and M_PI promotion, disabled effects, fractional output dimensions, high damage, seeds, both renderer consumers, independence and limits of native harness. Capture is modern Cinder/macOS numerical evidence, not original binary pixel certification. Native runtime replay and broader roadmap gates remain open.

Completed in c1694dc with evidence in docs/STATUS.md. Fresh review reproduced capture and verified hashes; no findings. Verification:2743units,203browserpasses/1intentionalduplicateskip,build/typecheckpass; no changed snapshots.
