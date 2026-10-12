# Shared inspector headings and dividers

Twenty-four exact native RGB comparisons cover the Gel, Buffer + Dyes and Species
headings, Dyes subhead, and two divider lines at DPR1/2 with a translucent view
before/after them. The initial CSS implementation failed every comparison.
Native capture scope is documented in reference/native/modern/shared-inspector-headings.

InspectorHeadings is used by all three real inspector components. It contributes
settings rules/subhead/heading after the brace and before child controls; the
Species heading follows the well and representative. DOM headings remain
accessible. Textures use native straight alpha, linear filtering and one level.
Captured layout metadata preserves native 2x integer texture-size division.

The real-app test switches through all three panels and separately covers each
heading, subheading and rule with an imported image. Deleting the image restores
the exact original pixels. Existing settings and layering tests also pass.

Reproduce with shared-inspector-headings-native.spec.ts and
shared-inspector-headings.spec.ts. Final verification: 2,917 unit tests, 717 browser
tests (one intentional skip), four production tests and build pass. Twelve native
scenes and eight text textures repeat and independently reverify. All shipped
textures/metrics are byte-identical to native capture; retained comparisons match
the final full browser run.

BufferView child labels/presets, dynamic slider values, menus and other controls
remain unmigrated. Shared presentation remains development-only. Original-release
GUI, cross-browser/platform and final acceptance gates remain open.
