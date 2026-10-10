# Shared effects gel startup

The development shared renderer draws scientific gel output on the same window
surface as the migrated sample and fragment graphics. It borrows the shared
device/context, owns its scientific render targets, and releases those targets
when either the component or graphics connection retires. Band/warp identity
continues to control scientific rendering; selection and panel changes do not
recompute the gel.

Four startup checks cover WebGPU/WebGL2 at DPR1/2. The shared gel crop equals the
existing gel presentation exactly. At DPR2, the gel and unloaded tube backgrounds
also have zero RGB differences against `native/modern/lossless-probe/startup.png`.
Native physical crops are gel `(416,248,780,1040)` and tubes `(528,160,668,88)`.
The tube crop excludes the loaded tube icon, which is still DOM paint.

The native tube color is raw UNORM. The mesh origin comes from the parent gel
bounds: subtracting the ideal fractional row offset from CSS-quantized row bounds
introduced a visible edge shift (159 differing channels, maximum difference6).
Using the actual gel origin eliminates that difference without changing reference
pixels or tolerances.

Recovery instrumentation now includes the scientific producer. A failed WebGL
constructor initially leaked four textures and four framebuffers. Synchronous
allocation rollback removes all surviving partial allocations and restores the
context methods. Six recovery tests pass, covering repeated loss/resize, injected
allocation failure with zero owned resources, retry with the same live molecular
engine, and late acquisition after route removal.

These startup captures do not certify original-release full GUI appearance,
rotated/scaled gel transforms, direct band rendering, loupes, images, or their
overlap with all UI paint. Shared rendering remains development-only. Task3 and
Task4 of the shared composition plan remain open.

`provenance.json` records the source and native PNG hashes for these captures.

Regression gates for this increment: 2,917 units, 565 browser cases (one intentional
skip), and four production checks plus the TypeScript/Vite build pass.


## Complete startup window after control migration

The full-window regression now compares every RGB channel of the 2730×1536
startup client area at 1365×768 logical pixels / DPR2 against the recorded native
framebuffer. Both WebGPU and WebGL2 have **zero differing RGB channels**. This
includes loaded/unloaded tubes, gel/wells/bands, timeline icons/track/handle/text,
both settings buttons, Help and the entire workspace. It supersedes the narrower
startup crops above for this size/scale, without changing the native reference.

The user-supplied window capture independently agrees exactly after removing its
64-pixel title bar and compositing the client on white. Its only alpha difference
is macOS rounded bottom window masking (584 non-opaque pixels); no application
region is masked or given a tolerance. Raw transparent corner RGB is zero, while
the framebuffer has white there.

`full-window/` retains both browser PNGs, exact comparison reports and hashes in
`provenance.json`. The test pins the native PNG hash and waits for real migrated
asset/font contributions before capture. This closes complete startup at this
size/scale. Populated/overlapping native workflows, other sizes/scales, original
release equivalence and production/platform acceptance remain open.
