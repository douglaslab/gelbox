# Shared application icons and inspector brace

Forty RGB comparisons match native captures exactly: Help and application button
idle/hover/pressed/covered states and the brace idle/covered states, at DPR 1 and 2
on WebGPU and WebGL2. Real HelpButton, FileControls and Brace components register
on the shared surface; the pixel fixture places them at a verified fractional
position and suppresses navigation/menu actions while comparing visual states.

Help and application controls retain their independent view keys. Brace paint
registers before the current inspector contents, so representative particles can
cover it. Input DOM, navigation, file/menu handlers and keyboard ownership remain.
The buttons share the source-backed tint hook; application and gel settings share
one cached settings icon texture in the same scene.

The shared-chrome interaction tests cover all three elements with imported opaque
images, then delete those images and use the application menu. Existing Help
navigation/resize and brace-under-representative tests now run in both modes.
The initial shared-chrome readiness test failed on both backends at both scales.
A separate native comparison fixture initially applied the Help position twice;
correcting the fixture and asserting every element's bounds resolved that failure
without changing the native images or application geometry.

Reproduce with shared-chrome-native.spec.ts, shared-chrome.spec.ts, help.spec.ts and
inspector-layering.spec.ts. Native source, asset and capture limitations are in
reference/native/modern/shared-chrome-scenes. Shared rendering remains development
only. Application menu text/checkboxes, other control paint and native fonts are
not certified by this increment.

Final checks: 2,917 unit tests, 665 browser tests (one intentional skip), four
production tests and build pass. All 40 retained native comparisons and PNG bytes
match the final full browser run. Twenty native captures repeat and independently
reverify. No tolerance or native pixels were changed to accommodate the browser.
