# Shared sample-panel frame and new-species button

Twenty-eight exact native RGB comparisons cover seven combined panel states at
DPR1/2 on WebGPU/WebGL2: idle, body hover/down, keyboard focus, button hover/down,
and a later translucent view. The actual SampleView component paints its header,
empty body, shadow, inset focus ring, physical border and new-species button in
native order. All four test instances failed on the old CSS border/button paint
before the shared implementation.

The rectangular frame geometry is shared with loupes; their existing 24 native
comparisons still pass. The native fixture extracts full SampleView drawing and
ButtonView state/paint methods. Its empty molecular adapter is documented in
reference/native/modern/shared-sample-scenes; particle rendering is independently
covered elsewhere.

Real-app tests cover the border and button with an imported image and verify that
clicks reach that image. Removing it and restoring focus reproduces the original
pixels. Releasing a button press outside cancels creation; a normal click creates
one species, retains sample keyboard focus and allows deletion. The existing
create/edit/delete/save, Alt-clone, sample settings and Tab tests now run in both
legacy and shared modes.

Reproduce with shared-sample-native.spec.ts, shared-sample.spec.ts and
species-editing.spec.ts. Final verification: 2,917 unit tests, 709 browser tests
(one intentional skip), four production tests and build pass. Fourteen native
captures repeat and independently reverify. Source/asset hashes and all retained
native comparison pixels were checked against the final full browser run.

Other inspector headings, dynamic labels, menus and controls remain unmigrated.
Shared composition remains development-only; original GUI, platform and final
acceptance gates are still open.
