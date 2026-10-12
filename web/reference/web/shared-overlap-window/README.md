# Full-window image, species and loupe overlap

Six complete scenes match native on each backend: twelve RGB comparisons with
zero differences at 1365×768/DPR2, without crops, masks or tolerance. The web test
imports the native document, drops and resizes real images, opens the species
inspector, creates a loupe, covers it with an image, then clicks to raise it.
Captured particles are replayed for equal rendering inputs.

The final click independently exposed a native selection-lifetime rule: empty
loupe selection retains the derived sample with an invalid fragment. The next
application tick follows that off-gel sample and closes the ordinary sample and
species views. Web loupe frame/anchor/wedge background handlers now retain that
reference, using the existing selection-following state machinery. Clicking a
source molecule reopens the ordinary sample through that same machinery.

The new full-window test failed on both backends before the fix. Existing loupe
selection tests also fail with the corrected native expectation before the fix;
the earlier expectation that the sample remained open was incorrect. No native
images or tolerances changed. Broader regression results are recorded in STATUS.

`provenance.json` pins input, source, test and output hashes. See
[native capture procedure](../../native/modern/full-window-overlap/README.md).
This is bounded modern-build, controlled-particle evidence, not complete RNG
history, original-release GUI, production shared rendering or platform certification.
