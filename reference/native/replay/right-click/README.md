# Original-native right-click creation, editing and deletion

Reference: unmodified `/Applications/Gelbox.app`, executable SHA-256
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`.
Input is byte-identical to `../file-workflow/native-input.json`. Lane 1 is absent;
lane 2 contains the existing sample, with the time slider at 1:53.

Observed original-native sequence:

1. Right-click client position (236,372), inside the empty first lane. Native
   creates a tube/sample and selected species, opening Sample and Species panels.
   Save Sample retains `native-created.json` (1734bp, random teal color and mass).
2. Through the actual controls, choose palette swatch 0, size low endpoint,
   mass high endpoint, and the monomer aggregate preset. Save Sample retains
   `native-edited.json`: 100bp, 175ng, aspect 1, degradation 0, aggregate
   [1,0,0,0,0,0,0], and the original native blue palette floats.
3. Press Backspace immediately after saving, without refocusing. The band and
   Species panel disappear. The selected empty tube and Sample panel remain.
   Save Sample retains `native-deleted.json`.

The compiled web test repeats the same right-click and deterministic controls.
Chromium WebGPU/WebGL2, Firefox WebGL2 and WebKit WebGL2 all pass. Edited sample
JSON matches exactly as parsed. Deleted sample comparison normalizes only the
native empty Fragments:null to the web empty array. The whole web gel save equals
the original input with only the empty lane 1 sample added; all other data,
including the neighboring sample, remains exact. Post-save Backspace focus and
retained empty tube/panel are asserted. Result files and web screenshots are
retained by configuration.

This is one finite secondary-button creation/edit/delete sequence. Native creation
is random, so native-created.json is observational evidence, not an RNG equality
assertion. No identical random species, native internal identity, paired pixel
comparison, modifier drag, secondary-button drag, or cancellation claim is made.
The native UI was observed through computer-use screenshots; retained PNGs here
are web screenshots. Product code and staged site artifacts are unchanged.

Reproduce from ts with an existing production build:

```sh
npx playwright test -c playwright.production.config.ts right-click.spec.ts
npx playwright test -c playwright.compatibility.config.ts right-click.spec.ts
```

This run used the isolated compiled runtime 4ba0139, preserving the separate live
memory-test build. `manifest.json` records the native binary and retained files.
