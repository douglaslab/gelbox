# Current numerical runtime memory preflight

The current fractional-shape candidate completed ten cycles with zero hold on
both Chromium Metal renderers: two tests passed. The unchanged frozen-sampling
validator accepts both reports. All eight renderer/GPU vmmap captures at cycles0
and10 contain physical footprints; no capture error files were produced.
This verifies recovered measurement machinery, not two-hour stability.

Runtime files and full regression results are recorded in
../../../../native/numerical/release-x86_64/integration-check.json.
The external frozen-session runner and unchanged budget remain in effect.
The previous failed two-hour reports remain untouched. A new120-cycle,
60-second-hold run is still required for current-runtime acceptance.
