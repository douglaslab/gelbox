# Original-native populated tube drops

Reference: original Gelbox app at `/tmp/gel-native-reference/extracted/Gelbox/Gelbox.app`,2730×1592 screenshot with1365×768 client plus28 logical title-bar pixels. No modifiers or persistent loupes were used.

## Native actions

1. Open `../hidden-lanes/input-twelve.json`: a12-lane gel with a populated sample in lane12, including two DNA species and four dyes.
2. Open `../multimer-drag/native-quantized-controls.json` as a sample. It fills empty lane1. Its7100bp species has a continuous aspect ratio, fractional aggregate weights, degradation and default TBE sample buffer. Both tubes and their different bands are visible; no sample panel is open.
3. Drag screenshot(1164,260)→(448,260), source lane12 onto occupied lane1. Source tube and bands disappear; the destination remains and no Sample panel remains open. Save Gel as `native-populated-occupied.json`.
4. Drag the surviving populated tube(448,260)→(448,120), above the gel. Its tube/bands disappear and no Sample panel remains open. Save Gel as `native-populated-offgel.json`.

Native screenshots were inspected through CUA, not retained as paired pixel goldens. The actual saved gel documents are retained. Here native writes a positional12-slot Samples array, so no writer-bug workaround or normalization is needed. After the occupied drop, only Samples[0] remains and equals the imported destination sample exactly. After the off-gel drop, every slot is null. The gel buffer, Time0.625, Voltage83.5 and WellDamage0.125 are unchanged.

## Compiled comparison

`ts/tests/production/tube-movement.spec.ts` imports the same two files and waits for their populated lanes. It replays the two endpoint gestures, converting screenshot positions to client coordinates by dividing by2 and subtracting28 from y. It asserts source removal, destination retention, panel closure, final empty tubes, and **exact equality of both complete saved gel documents**. No fields are omitted or normalized. Four backend/engine configurations pass: Chromium WebGPU/WebGL2, Firefox WebGL2 and WebKit WebGL2. Per-configuration saved documents and final screenshots are retained.

The targeted runs also repeat the earlier tube-movement test:4 production tests and4 compatibility tests pass. Runtime is unchanged from89ee201; this increment adds verification only. The first draft assertion expected data-empty=false, but the component represents populated tubes by omitting that attribute; the corrected test uses the existing absence-of-true convention. No product change, tolerance adjustment, deployment or review-bundle refresh was required.

This verifies the unmodified populated occupied/off-gel branches without persistent loupes. Alt-cloning, retained loupe identities/content, and other cross-view operations remain in W02.
