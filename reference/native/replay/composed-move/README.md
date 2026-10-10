# Original-release selected multimer / tube move

Input is the seven-lane document saved by the original release after recovery
of its keyed Samples export (see `../../files/interop/gel/release`). All files
in this directory are local parity evidence, not user data.

Original GUI sequence at 1365×768 client size, display scale 2, 56px title bar:

1. Clear incidental dialog modifier/loupe state with Escape, then click the
   populated lane-two tube at window pixel (583,240).
2. Click the degraded multimer at (583,420). Sample and Species panels open;
   the inspector shows 2,500 bp and 35 ng, and every segment of that fragment
   has the selection outline.
3. Cmd+L enables the hover loupe over that band (`selected-hover.jpg`).
4. Drag the tube from (583,240) to (806,240), moving lane two to lane four.
   The sample and Species inspector retain their selection, the sample view
   keeps keyboard focus, and the hover preview disappears (`moved.jpg`).
5. Cmd+S saves `moved-native.json`. Compared with input.json, only the sample's
   lane changes; every sample field and simulation setting is exactly retained.

`native-composed-move.spec.ts` replays the selection, hover and move in both web
backends, including multiple pointer positions through the inter-tube gaps.
It checks panel identity, selected species/strokes, keyboard focus, hover
closure and exact downloaded-document equality with the original release.

The comparison exposed and corrected three web omissions:

- Sample body incorrectly reused the rounded tube-background radius; native
  uses a square frame, offset/inset shadow, thin border and focus rings.
- Species preview was a flat color swatch. Native MolecularSim.cpp:547 selects
  the first part with the greatest positive fade for the fragment and draws
  its existing mesh centered in the well, without selection/hover outlines.
  The web now shares the sample's live MolecularView and mesh builder. It adds
  a renderer, not a simulation or random stream. A transparent surface spanning
  the inspector avoids clipping ordinary multimers to the 80px well itself.
- Tube drag retained keyboard ownership on the web row, including after a
  sample panel remount while crossing gaps. Native GelView.cpp:542 gives it to
  the sample view. The web now restores that handoff during captured movement.

Two representative-mesh unit cases and the frame/focus browser checks failed
before their respective corrections. Browser pixel checks verify a palette
edit changes rendered representative pixels within the well; the neutral well
background remains unchanged. DPR tests now cover the representative canvas
and explicitly prove it shares the sample engine, with only two engines for
sample + representative + loupe.

## Limits / follow-up

Native captures are CUA JPEGs with display conversion, cursor overlays and
unfrozen particles. Web PNGs are observations, not native pixel goldens.
Animation phases/densities cannot be compared from these asynchronous captures.
Persistent Command-drag loupe movement and cloning remain unverified in this
GUI sequence: the available native input API cannot reliably hold Command
across a mouse action. Hover-loupe evidence does not certify that workflow.

The comparison/source inspection also identifies follow-up work: native's
nearest-color palette selection, sample header tube geometry, and degradation
slider label visibility. Full focus behavior across inspector controls,
representative overflow beyond inspector bounds, native raster tolerances and
long-run resource/performance budgets remain open.
