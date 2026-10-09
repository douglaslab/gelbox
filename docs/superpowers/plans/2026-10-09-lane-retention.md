# Native lane retention and settings selection

Reference: native 5f51097 Gel::setLayout grows but never shrinks sample storage; syncBandsToSamples and toJson enumerate visible lanes. GelView settings button deselects fragments and microtubes before opening the panel.

- [x] Replace truncation regression with retained sample identity across shrink/grow, visible-only export, and import targeting tests.
- [x] Verify opening/closing gel settings clears sample/species selection rather than reviving stale panels.
- [x] Browser replay: import populated last lane, select it, reduce lanes, save, restore lanes, save; verify exact sample data and lane counts.
- [x] Preserve storage and selection identity on layout changes; clear selection at native settings entry boundary.
- [x] Run unit/browser/build checks and review increment.
