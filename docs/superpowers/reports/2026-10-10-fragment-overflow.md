# Fragment preview overflow and heading order

Base revision: `78a6c1c`. Native `ViewCollection::draw` applies each view's
transform without clipping to that view. `FragmentView::draw` draws the well and
representative before its heading; child controls follow. The old web preview
was bounded by a 303×520 canvas and the heading preceded it in DOM paint order.

The composite preview now expands to the visible window when its mesh first
crosses a panel edge. It retains that extent to avoid reallocating multisample
buffers as a molecule rotates or grows. Logical origin translation keeps the
well and particle in panel coordinates. Canvas allocation remains bounded by the
window even for a radius of one million; live DPR changes resize the existing
canvas. The heading follows the well and precedes child controls.

Four browser regressions (both backends, DPR1/2) exercise the production
FragmentView with a controlled existing MolecularView. They verify visible
particle pixels beyond the panel, actual heading-colored glyph pixels, stable
window-bounded backing sizes, retained canvas identity through live DPR changes,
and an exact native well crop after restoring a normal particle on the expanded
surface. The original implementation failed the overflow assertion. Moving the
heading back before the well made all four glyph checks fail with zero heading
ink, while the oversized particle remained visible.

Independent reviewer `/root/review_fragment_composition` found one Important
layout regression: a relatively positioned expanded canvas enlarged its parent's
flow footprint, adding blank workspace scroll area. A production-style scrolling
fixture reproduced 1000×1100 scroll dimensions in an 800×900 window. Absolute
canvas positioning fixes it; the same test now requires unchanged scroll size.
The corrected focused run passed ten tests, including the existing 60 native
well comparisons and molecular DPR integration. No second review was requested;
the finding is verified by its failed-then-passing regression.

This is not full composed native certification. The known white-underlay method
still needs work where translucent particles cover earlier non-white content,
such as the brace or other views. Opaque overflow pixels and heading order are
verified here; arbitrary underlying content and native GUI histories are not.
Final full-suite counts and terminal logs are recorded in STATUS.
