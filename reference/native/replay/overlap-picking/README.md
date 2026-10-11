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
clone/drop and remaining selection/drag branches remain W02; unequal overlap remains W04.

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

## Native gesture and source-selection continuation

From native-loupe-return.json's live UI state (the same original loupe, not a
new document import), press ordinary `a` and perform these screenshot-coordinate
left-button actions:

1. Frame drag (700,990)→(760,1030): frame moves +60,+40 physical pixels, probe
   stays at approximately(478,858), green molecule remains, source panel closes.
2. Probe drag (478,858)→(590,858): frame stays, probe moves into empty lane2,
   molecule disappears.
3. Wedge drag (650,858)→(538,858): frame and probe both move −112 physical
   pixels in x. Probe returns to the band and green molecule reappears.
4. Click the green molecule at(873,920): lane1 sample and 700bp species controls
   open, with source molecules and band highlighted.
5. Click empty loupe space(640,1040): sample/species panels close; molecule stays.
6. Save native-loupe-gestures.json. Its complete gel is unchanged from the return
   checkpoint.

The compiled continuation applies the same converted pointer gestures, asserts
frame/probe deltas, content disappearance/reappearance and panel state. It picks
the actual visible green molecule from a canvas screenshot instead of assuming
independent simulations have identical particle coordinates. The original web
canvas persists. All four configurations pass and save the exact native gel.
Gesture screenshots and separate gesture-production/compatibility.log files
retain the new run; earlier logs remain the preceding move/return scope.

The first continuation assertion expected the probe coordinate's original
string after adding and subtracting56. JavaScript evaluates
30.999999999999996+56−56 as31. The final assertion checks that exact arithmetic
result; no geometry tolerance or runtime change was introduced. The initial
failure is retained in gesture-arithmetic-initial.log.

This verifies one composed left-button trace for all three drag modes and both
molecule/empty-background selections. Secondary buttons, overlapping probe/frame
priority, cancellation, keyboard and other modifier histories retain their
existing lower-level evidence and outstanding native-trace scope. Absolute
cross-app frame geometry, focus pixels and particle trajectories remain outside
this workflow assertion.

## Buffer continuation with the existing loupe

Continue the original native session after the gesture save. Click gel settings
at screenshot(1164,1404), H2O at(1552,356), then save native-loupe-h2o.json.
Click half-strength TBE at(1644,356), then save native-loupe-tbe.json. Native
water shows four zero concentrations and visibly diffuses the band; TBE shows
Tris44.5, Borate44.5, Acetate0, EDTA1 and restores the narrower band. The same
loupe remains at its anchor/frame location and retains its green molecule in
both states. The gel-settings panel stays open; source panels remain closed.

The compiled continuation uses the real preset controls, compares each complete
saved gel exactly, checks retained canvas identity and fixed frame/probe position,
and requires a populated loupe in both states. Gel-region screenshots must differ
between water and TBE, so the assertion is not limited to control labels or saved
values. The retained screenshots were visually inspected; this is not an exact
native pixel comparison. buffer-production.log and buffer-compatibility.log each
report two passing configurations. No runtime changes were needed.

This supplies an original-native buffer/loupe action trace for W05. The existing
compiled recovery tests separately cover injected graphics failures and emulated
resize/DPR. It does not stand in for physical monitor or OS lifecycle checks.

## Persistent loupe across hidden lane12

Continue with native gel settings open and TBE selected. Click lane-count track
at screenshot(1610,822) to select12; close settings at(1164,1404). Press ordinary
`a`, drag tube(448,258)→(1164,258), then probe(478,858)→(1164,858). The sample is
now in lane12 and the original loupe shows its green molecule. Reopen settings.
Click minimum-lanes icon(1450,822): seven lanes remain, tube and band are hidden,
and the existing loupe becomes empty without moving. Save
native-loupe-hidden-seven.json. Click(1610,822) again: lane12, tube, band and
loupe molecule return. Save native-loupe-restored-twelve.json. Native screenshots
were inspected through CUA; no pixel-golden claim is made.

The compiled continuation matches these actions and visible transitions in all
four configurations. Frame/probe positions and original canvas identity remain
unchanged during reduction/restoration. The seven-lane document matches native
exactly. Both applications omit hidden sample slots from a seven-lane save;
retention here is within the live document, not a hidden-data save roundtrip.
The restored native writer emits a keyed Samples object and loses lane indices.
Under accepted D01, the comparison explicitly reconstructs twelve slots with its
unchanged saved sample at observed lane12, then compares the whole web document.
No numerical tolerances or sample-field omissions are used.

hidden-production.log and hidden-compatibility.log retain passing runs; each
browser folder contains the two lane-count screenshots and downloads. This
supplies the previously missing native persistent-loupe branch for W03. Earlier
hidden-lanes evidence covers subsequent species editing and establishes that
opening gel settings clears selection, making hidden-selected editing unavailable
through this sequence. Other W02 modifiers and drop histories remain separate.

## Populated tube off-gel removal with retained loupe

From the restored twelve-lane native state, close gel settings at
screenshot(1164,1404), press ordinary `a`, and drag tube(1164,258)→(2300,258).
The populated tube and its band disappear, sample controls close, and the same
loupe remains in place with no molecules. Save native-loupe-off-gel.json: all
twelve slots are null, with buffer/time/voltage/damage unchanged.

The compiled continuation uses client(582,101)→(1150,101), checks no bands or
sample panel, zero loupe particles, unchanged probe/frame and the original canvas
identity, then compares the entire saved gel exactly. All four configurations
pass (offgel-production.log and offgel-compatibility.log); corresponding files
and visible-state screenshots are retained. No normalization or runtime change
was needed. This closes the populated off-gel/persistent-loupe branch, without
claiming the remaining occupied-destination or modifier-clone loupe histories.

## Unequal-overlap independent selection case

Open input-unequal.json in the original native app. It differs from input.json
only in the first purple species' Mass200; the second green species remains
Mass19.5. Both are700bp and overlap. Click screenshot(472,856): the native
species panel shows green,700bp,20ng. Press Backspace and save
native-unequal-after-delete.json. Only the first purple200ng species survives.
This distinguishes minimum-height picking from the earlier equal-height
first-in-order tie rule.

The separate compiled unequal-overlap test confirms two bands with different
UI heights, clicks client(236,400), deletes, and compares the complete saved
gel exactly. Chromium WebGPU/WebGL2 and Firefox/WebKit WebGL2 pass; logs,
downloads and after-delete screenshots are retained under unequal-* filenames.
No runtime changes were required. This verifies one unequal-height overlap
selection/deletion trace, not all overlap drag paths or modifier histories.
