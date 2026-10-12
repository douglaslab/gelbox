# Shared loupe rendering

All24 RGB comparisons match the independent native loupe scenes exactly: six
states at DPR1/2 on WebGPU/WebGL2. Real Loupe, SampleSimCanvas and FragmentWell
components use the shared window surface. The fixtures cover focused and idle
rings, callout fill/stroke, shadow, clipped particles, inset focus border, frame,
transient preview, reversed fragment overlap, an anchor inside the frame, and
anchor hover. Native inputs and limitations are documented separately in
`native/modern/shared-loupe-scenes`.

The loupe registers paint before and after its molecular body under the same
view-order key. Its old SVG/CSS painting is hidden in shared mode while DOM
pointer targets, capture, keyboard handling and focus remain active. The particle
canvas acquires no graphics context; neither this migration nor recovery creates
a replacement molecular engine.

The initial shared-loupe test failed on both backends before migration. The
anchor-hover native comparison subsequently failed on both backends at both
scales: the panel remained too light because canvas-only rollover missed the
anchor. A loupe-level pointer/pick-aware background reader fixes that mismatch.
The reader applies only to the shared path. It also retains the particle canvas's
button-down state.

Shared versions of the existing interaction tests cover all three drag modes,
resize, paused particles, capture cancellation, raise/delete, keyboard ownership,
and anchor priority inside the frame. The drag-content comparison normalizes the
pointer to idle before both images, since native anchor hover changes the body
shade. Independent native comparisons replace the old CSS screenshot assertion
for shared mode; the legacy screenshot assertion remains.

Recovery tests now keep a persistent loupe alongside the sample: repeated backend
loss, resize, allocation failure/retry and effects/direct switching retain both
engines and their content, with stable explicitly owned resource counts and zero
remaining resources after route exit. This does not measure driver-resident GPU
pipeline memory.

The full run also exposed three instrumented test files (six backend cases)
whose exact module URL intercepts missed Vite hot-reload query strings. Matching
that suffix restores their instrumentation; their assertions remain intact.

Shared rendering remains development-only. Reference images, remaining composed
workflows/transforms, original GUI certification and other UI paint remain open.

Final regression: 2,917 units,593 browser cases(one intentional skip),four
production checks and TypeScript/Vite build pass. The12 native raster captures
and both legacy ring geometries were repeated and independently reverified.
