# Original native tube movement checkpoints

The original native GUI replay moved the populated tube from lane 12 to empty lane 1, saved the selected sample, created an empty sample in lane 2, saved that destination, and dragged lane 1 onto occupied lane 2. The source disappeared, the empty destination remained, and the sample panel closed. These native JSON checkpoints were saved through the original app before this verification turn; screenshots were observed but not retained as files.

The paired compiled browser test imports `../hidden-lanes/input-twelve.json` and performs the same actions through actual pointer input and Save Sample/Save Gel downloads. It compares the moved sample exactly and the entire resulting gel including all twelve lane positions. Native empty `Fragments: null` is explicitly normalized to web `Fragments: []`; no other values are normalized. This particular native gel checkpoint contains an array, so its lane positions are checked directly. It does not resolve other native keyed-writer cases (D01).

Fresh production build and four cases pass: Chromium WebGPU/WebGL2, Firefox WebGL2, and WebKit WebGL2. Browser saved documents and screenshots are retained by project; these screenshots are not paired native pixel evidence. Test: `ts/tests/production/tube-movement.spec.ts`.

The off-gel gesture was attempted in the preceding native session, but its final observation was unavailable and no checkpoint was saved. On resuming, the original app returned `cgWindowNotFound`; therefore off-gel native replay remains unverified. Alt cloning, persistent-loupe identities, and the remaining W02 gestures also remain open. No product runtime or website review snapshot changed.
