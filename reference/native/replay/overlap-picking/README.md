# Original-native tied overlap and persistent loupe tube movement

Reference: original Gelbox executable SHA256
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`,
source reference `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`.
Web implementation base: `97cdcf4`; this increment changes tests/evidence only.

## Observed native actions

Open input.json: seven lanes, two coincident 700bp, 19.5ng species in lane1,
purple first and green second. At 1365×768 client/DPR2, click screenshot
(472,856), then Backspace. Save native-after-delete.json: only green survives.
This independently checks tie ordering; it does not cover unequal overlaps.

Shawn manually Command-clicked the surviving band. The original persistent
loupe anchor was approximately screenshot(478,858), with green particles.
The first automated tube drag (472,240)→(584,240) unexpectedly created a second
empty loupe, leaving the tube in lane1. Retained Command state across the
manual/automation handoff is suspected, not established. Pressing ordinary `a`
and repeating the drag moved the sample to lane2; the original loupe stayed
in place and emptied. Click the extra loupe at (920,160), then Escape to close
it. Save native-loupe-away.json. Press `a`, drag (584,240)→(472,240), and save
native-loupe-return.json. The original loupe refilled with green particles.

Native screenshots were inspected through CUA, not retained as pixel goldens.
The saves contain document state, not loupe identities or positions. Native
loupe persistence/content is therefore supported by the recorded visible trace;
web frame/canvas identity and fixed anchor/frame are additionally asserted.

## Compiled replay and scope

The production test converts screenshot coordinates using x/2, y/2−28. It
explicitly holds Meta for the extra-loupe gesture, then releases it. This
reproduces the observed setup and cleanup without claiming that the browser
has the suspected native sticky-modifier behavior. All three web downloads
are compared with the complete native saves exactly, without normalization.
The original web frame and canvas remain the same DOM elements, the frame
rectangle and anchor center stay fixed, and live particle count goes positive
→ zero → positive. Saved screenshots show the corresponding visible states.

Chromium WebGPU/WebGL2 and Firefox/WebKit WebGL2 pass. These are workflow and
saved-state comparisons, not exact native pixel comparisons or native internal
view-identity instrumentation. Native/web focus chrome, exact cross-app loupe
placement and particle trajectories are not certified by this test. Other
clone/drop/selection/loupe-drag branches remain W02; unequal overlap remains W04.

The initial replay assertion compared SVG anchor bounding boxes across focus
states. It failed because focus changes stroke width from1.5 to1.1. The final
check compares exact cx/cy coordinates instead; frame geometry remains exact.
anchor-stroke-initial.log preserves that test-only failure. No runtime fix was
needed.

Run from ts:

```
npx playwright test -c playwright.production.config.ts overlap-picking.spec.ts
npx playwright test -c playwright.compatibility.config.ts overlap-picking.spec.ts
```
