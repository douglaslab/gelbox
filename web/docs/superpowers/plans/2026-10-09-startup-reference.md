# Native startup document

Native GelboxApp::setup loads palette/1kbladder.xml at lane0. The recorded native export reference/native/files/ladder-after-selection.gel.json contains the startup scientific/document fields (selection is not persisted). Current generated fixture differs in colors, aggregates and metadata; generator instead produces obsolete synthetic data.

- [x] Add failing startup serialization comparison against the independent native document and browser Save Gel case.
- [x] Regenerate ladder fixture from the recorded native sample using a deterministic generator; include provenance and preserve native channel floats, monomer weights and metadata. Check regeneration is byte-stable.
- [x] Verify units/browser/build; inspect rendering differences before updating affected web-only snapshots; fresh review and evidence record. Native raster certification remains open.

Final:331unit/158browser/build pass. Fresh review has no blockers. Six inspected particle regression baselines updated for raw RGB and native Aggregate[1] RNG consumption; broader native raster certification remains open.
