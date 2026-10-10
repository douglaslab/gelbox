# Shared settings icon

Sixteen RGB comparisons match the independent native settings button captures
exactly: idle, hover, pressed and covered states, at DPR 1 and 2 on both backends.
The real SettingsButton component contributes its icon after the gel body under
the gel view key. Its DOM button retains input and accessibility, with image and
background paint hidden in shared mode. Opening settings does not create a native
pressed tint when the pointer is outside the button.

The shared asset owner caches decoded bitmaps and backend textures by resolved
URL within each scene. It retains the bitmap across backend loss, reference-counts
multiple consumers, and disposes late decode after the final consumer exits.
A failed load stays visible as an error; a new graphics connection retries it,
including explicit retry after a temporary network failure.
An opaque imported image can cover the settings icon; deleting the image restores
normal button interaction. Reference-image resource probes separately count file
images and UI assets. The held-module test uses a unique test import URL so an
already-loaded asset texture helper cannot bypass its asynchronous boundary.

Reproduce with the shared-button-native, shared-settings-button and shared-assets-*
Playwright tests. Native source and fixture limitations are documented in
reference/native/modern/shared-button-scenes. Other controls, text and the final
production renderer switch remain unaccepted.

Final regression: 2,917 unit tests, 651 browser tests (one intentional skip),
four production smoke tests and build pass. The final full run reproduced all
16 retained comparisons and capture bytes exactly. Eight native scenes were
recaptured twice and independently reverified. No comparison tolerance changed.
