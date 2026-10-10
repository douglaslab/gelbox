# Native loaded and dragged tube scenes

The host extracts GelView::drawMicrotubes, drawDragMicrotube, calcMicrotubeWellRect,
calcMicrotubeIconRect and pickMicrotube verbatim from pinned Gelbox. It also uses
the entire pinned Layout header and its actual snapToPixel methods. The adapter
supplies gel dimensions, lane occupancy/selection and mouse state. Actual Cinder
image upload, mip generation, rounded geometry and texture drawing produce the
RGBA8 MSAA4 captures. The gel body is a plain black rectangle in this fixture.

Five states at content scale 1/2 cover seven/twenty lanes, selected/loaded tubes,
free dragging and an occupied destination. Native icon rectangles are recorded in
the manifest alongside image hashes. Every run repeats captures and texture dumps,
then verifies retained bytes. The PNG is checked against the pinned repository;
absence of the @2x variant is asserted. Native Layout falls back to this same 1x
image at content scale 2.

Run `python3 reference/native/modern/shared-tube-scenes/capture.py`. The pinned clean
modern Cinder checkout and release library are required. `--update` explicitly
replaces references. The texture dump helper comes from shared-image-scenes.
This is a source-extracted offscreen rendering host, not the original full native
GUI. Band simulation, sample headers and other UI paint are outside these scenes.
