# Shared gel selection and hover paint

Eighty-eight exact native RGB comparisons cover the GelView focus method at
both scales/backends and both overlap orders. The initial empty implementation
failed all four differential tests. The native two-unit stroke triangle strip,
float32 rectangle arithmetic, unrounded focus colors and combined .65/.35 alpha
passed without changing native reference pixels or thresholds.

GelOverlay now contributes these meshes at gel order 40: after scientific band
paint and wells, before dragged tubes at 50. The native gel scissor clips the
outlines. SVG hit regions and their existing selection/drag handlers remain in
place; their duplicate paint is hidden in shared mode. Explicit SVG visibility
hiding also suppresses the shared contribution, preserving scientific-image-only
inspection without affecting normal rendering.

Real-app tests initially failed because the SVG focus outline painted above a
later reference image. After migration, hover changes opacity and restores it on
exit; later images completely cover the selected band and deletion restores it.
Both effects/direct modes, both DPRs and both graphics backends are covered.
Existing scientific-render invalidation checks still pass: focus changes do not
regenerate the scientific gel image. Units verify identity shared across lanes,
immutable sample edits, independent sample copies, unrounded DNA colors and dye
focus using half the band display color.

The geometry comparison uses fixture UI rectangles/colors; it does not certify
all scientific-to-UI histories. Remaining input audits, integrated native GUI
acceptance, whole-branch review and platform/performance checks still gate
production enablement. Shared presentation remains development-only.

Final verification: 2,924 unit tests, 821 browser tests (one intentional skip),
production build and four root/subpath checks pass. All 88 final screenshots and
comparison reports are retained here. Prior 128 slider, 40 Buffer, 24 Dye, 96
palette and 48 menu comparisons remain exact. Native input/artifact hashes were
verified against the independently rebuilt references.
