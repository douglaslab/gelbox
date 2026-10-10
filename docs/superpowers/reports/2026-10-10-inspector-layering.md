# Inspector backgrounds and brace order

Base revision: `510ac20`. At pinned native revision `5f51097`, the draw methods
of FragmentView, SampleSettingsView and GelSettingsView draw their brace and
contents without an opaque full-panel background. FragmentView draws its brace
before its well and representative. The web had full white CSS backgrounds on
all three inspectors and a separate brace sibling after the inspector content.

Removed the three full-panel fills and moved the brace sibling before the
inspector slot while retaining the shared native view z-index. This does not
change hit regions, view insertion order or keyboard ownership. The underlying
window remains white where no earlier image/view contributes.

A real image-drop workflow puts an image below a newly opened Species panel.
The test verifies the panel still owns picking at an empty point while that
point shows the earlier red image. Both renderers first returned white and now
return the image's exact red. The setup switches through sample settings before
the drop to avoid re-opening the prior inspector from retained hover state.

Four Stage/FragmentView regressions find a visible pixel in the real brace asset,
then draw an opaque oversized representative over it. The old sibling order
left brace-colored pixels on top of the molecule; both backends at DPR1/2 now
return the molecule's exact RGB at that point. These are source-backed draw-order
checks, not certification of the brace asset's native sampling at every scale.

The focused run passed 36 tests, including image lifecycle/ordering, preview
overflow and the 60 native well RGB comparisons. Final unit/browser/build counts
are recorded in STATUS after terminal results. No goldens or native references
were regenerated.

Remaining: the preview still bakes covered RGB against a known white underlay.
A translucent molecule over earlier non-white content requires further compositor
work; these fixes establish correct panel transparency and order but do not solve
that blending limitation or complete the full native GUI/release gates.
