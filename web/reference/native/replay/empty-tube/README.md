# Original native empty-tube lifecycle replay

The unmodified original release at `/tmp/gel-native-reference/extracted/Gelbox/Gelbox.app` was operated through its actual controls, starting from the existing hidden-lanes/input-twelve.json fixture. Its lane1 (index0) is initially absent; only lane12 contains a sample.

1. Select the first empty tube. A selected empty tube and focused empty Sample panel appear, with a New Species button and no Species panel. Save Sample produces native-empty.json.
2. Click New Species. Native creates a random species and selects it. Make the outcome deterministic through actual controls: choose palette swatch0, size low endpoint (100bp), mass high endpoint (175ng). Save Sample produces native-added-edited.json.
3. Press Backspace immediately after Save Sample, without refocusing. The final species disappears; the tube, empty Sample panel and New Species control remain. Save Sample produces native-deleted-final.json, identical to native-empty.json. Escape leaves/reopens the empty Sample panel in the observed settled state.
4. Repeat those controls in the compiled web app. Four tests pass: Chromium WebGPU/WebGL2, Firefox WebGL2 and WebKit WebGL2. The edited native/web sample documents match exactly as parsed, including native palette float values. The web full-gel save adds only the empty lane1 sample and preserves every other field and lane12 payload. Backspace works after Save Sample without a test-inserted focus action; Escape settles with the same lane selected.
5. Open the webgpu/web-gel-after-deletion.json in the original native app. Both occupied tube positions are visible and lane1 is empty. Select lane1 and Save Sample into webgpu/native-reopened-sample.json. It exactly matches native-empty.json and native-deleted-final.json.

Native encodes an empty fragment collection as null; web encodes it as []. The comparison normalizes only that explicitly identified empty-collection representation. The actual original-native reread confirms it accepts the web array and saves the same empty sample. This does not waive the unrelated native keyed gel-writer defect (D01).

Original GUI states were observed through computer-use screenshots; native saved files are retained byte-for-byte. The screenshot files retained here are compiled-web output, not native captures or a paired pixel comparison. Native view pointer identities and the other W02 gestures are not certified by this sequence. The twelve-lane input was restored afterward for the still-pending persistent-loupe replay; the initially visible loupe was a transient hover view.

Reproduce the compiled checks from ts:

```sh
npm run test:visual -- -c playwright.production.config.ts empty-tube.spec.ts
npm run test:visual -- -c playwright.compatibility.config.ts empty-tube.spec.ts
```

No product runtime, native release package or website review snapshot changed.
