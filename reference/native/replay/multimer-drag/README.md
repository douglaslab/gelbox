# Original-native degraded multimer drag

Starting file: `../hidden-lanes/input-twelve.json`. Only lane12 contains a sample: two DNA species and four dyes, including a2500bp species with Aggregate[0,0.25,1], Degrade0.375, Mass35.125 and AspectRatio1.25. The gel has Time0.625, Voltage83.5 and mixed buffer settings.

## Actual native actions

Original reference app,2730×1592 screenshot,1365×768 client area plus28 logical pixels of title bar:

1. Open the starting fixture. Click screenshot(1164,518); Species shows2500bp/35ng and the degraded multimer outlines are selected.
2. Drag(1164,518)→(1098,518), moving the species from lane12 to empty lane11. Both source and destination tubes remain; destination is selected and Species still shows2500bp. Save Gel as `native-horizontal.json`.
3. Drag(1098,518)→(1098,618). Species shows1600bp. Save Gel as `native-vertical.json`, then Save Sample as `native-vertical-sample.json`.

The saved selected sample records **1642bp** exactly. Its mass, aggregate weights, color, aspect and degradation are unchanged; it resides in a new default TBE sample. Screenshots were inspected through CUA but not retained as paired pixel goldens. No modifier keys were held during the drags. This exercises a degraded species with non-monomer aggregates, but does not independently expose the picked aggregate tier/offset from the original binary.

## Comparison and native writer limitation

Both native whole-gel saves use the defective keyed writer: only the remaining source sample survives under `Gel.Samples.Sample`; the destination is omitted. The source's swap-deleted fragment order and all metadata are retained as independent evidence. The accepted D01 web correction preserves both lanes.

The compiled test imports the same file and replays the pointer positions, dividing screenshot coordinates by2 and subtracting28 from y. It checks selected destination lane10(zero-based), the horizontal display value, both saved source-sample payloads against native, and the final selected sample **exactly** against native Save Sample. It also checks the full web document changes only by the destination sample's vertical edit. No tolerance or normalization is used. The horizontal destination numeric payload was not independently saved by native, so its rounded label alone is not claimed as exact numeric proof.

Four configurations pass: Chromium WebGPU/WebGL2, Firefox WebGL2 and WebKit WebGL2. Per-project downloaded documents and final screenshots are retained. Test: `ts/tests/production/multimer-drag.spec.ts`. Compiled runtime was unchanged from the last fresh build at7f37543; subsequent commits changed tests, notices/docs or evidence only.

This closes this finite positive-voltage, unmodified gesture sequence. W04 still requires zero/negative voltage, modifiers, overlaps and independent tier/offset observations; W02 still has clone/dye/loupe workflows. No product behavior, website snapshot or native release package changed.

## Aggregate controls continuation (2026-10-11)

From the selected1642bp species above, actual original-native clicks at screenshot(2268,1046), (2577,1047), then(2195,1047) edit the first graph column, choose the high aggregate preset, and choose the low preset. Save Sample after each action yields `native-aggregate-edit.json`, `native-aggregate-high.json`, and `native-aggregate-low.json`. Aggregate arrays are respectively[0.5,0.25,1,0,0,0,0], [0,0,0,0,0,0,1], and[1,0,0,0,0,0,0]. All other sample fields remain unchanged.

The extended compiled test performs these three clicks after the same transfer/vertical-drag sequence, using the same screenshot-to-client conversion, and compares each entire saved sample exactly. All four configurations pass (aggregate-production.log and aggregate-compatibility.log). This verifies one column edit and both presets; multi-column drags, release outside/cancel, slider handle offsets and focus transitions remain open under R01/W02. No product implementation changed.
