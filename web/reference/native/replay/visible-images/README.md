# Original-release image Open, manipulation and gel replacement

Original `/Applications/Gelbox.app`, executable SHA-256
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`, with all
99 resources equal to the extracted reference bundle. Native window2730×1592,
client1365×768/DPR2. This is a separate process; the original window awaiting
manual Option-drag was left unchanged.

## Native sequence and observations

Start from `../isolated-tier/native-upper-grab.json`, with its1672bp trimer
selected and Sample/Species visible. Cmd+O accepts these files even though the
source supplies a JSON/XML filter. Each image initially appears at client(0,0)
with its stored32×24 dimensions and keyboard focus.

Use fixtures from `../../image-decoding/inputs/`. Coordinates below are native
window screenshot pixels, including the title bar. After each Open, press an
ordinary `a` before dragging to refresh modifier state.

| File | Move | Resize handle | Final client frame x/y/w/h |
|---|---|---|---|
| orientation-6.jpg | (20,76)→(1500,300) | (1530,316)→(1850,556) | 740/112/192/144 |
| alpha.png | (20,76)→(1500,420) | (1530,436)→(1850,676) | 740/172/192/144 |
| animated.gif | (20,76)→(2020,420) | (2050,436)→(2370,676) | 1000/172/192/144 |

The JPEG remains landscape, with red/green top quadrants and blue/yellow bottom
quadrants: its EXIF rotation is ignored. The PNG shows the underlying JPEG and
sample particles through its transparent/translucent strips. The later GIF
covers the Species representative and brace, and remains the four-quadrant first
frame rather than switching to the fixture's magenta second frame. Aspect ratio
is preserved during resizing. Native source confirms16px resize handles; their
gray paint can obscure much of the initial tiny image's bottom-right quadrant.

Save Gel with all three images present as `native-with-images.json`. It exactly
equals the starting gel: images are view resources, absent from saved document
data. Open `../isolated-tier/input.json`: the Sample/Species panels close, the
gel returns to3000bp, and all three images remain in place. The GIF retains its
yellow focus outline. Press Backspace: only the GIF disappears; PNG and JPEG
remain. Save Gel as `native-after-replace.json`, exactly equal to that replacement
input. The native save dialog initially used the isolated-tier directory for this
second checkpoint; its generated file was moved here without content changes.

Screenshots were inspected through CUA at each image stage, replacement and
deletion. They are visible observations, not retained lossless pixel goldens.
Frame values combine the observed placement with the recorded pointer deltas and
native ImageView geometry; native internal rectangle values were not read.

## Discrepancy and correction

The first compiled replay failed on both Chromium backends while opening the
JPEG. `FileControls.onFileChange` always read files as text and passed them to
`deserializeFile`; Open could not load images even though dropping them worked.
`open-image-red.log` retains that failure. Open now recognizes the existing
JPG/PNG/GIF extensions and calls the same ReferenceImageStore loader as drop,
inside the shared load queue. It uses the native origin default, preserves the
existing decoder/disposal behavior, and offers those extensions in the picker.
Successful loads close the menu; failures use the existing Open error surface.

The compiled replay in `ts/tests/production/image-decoding.spec.ts` reproduces
all moves/resizes, verifies stored32×24 and final192×144 frames, retains images
through gel replacement, checks source panels close, verifies focused GIF deletion,
and compares both entire gel downloads exactly. Two GIF image-region captures
500ms apart must match; the fixture has two different100ms frames. Four interior
quadrant pixels also match the retained native first-frame RGBA data exactly,
preventing a blank or frozen second frame from satisfying the stability assertion.
This strengthened assertion passes on both Chromium backends, Firefox and WebKit.
Per-project
screenshots and saved documents are retained for all four backend/engine cases.
No native pixel-equality claim is made from these CUA observations; the separate
decoder and native texture corpora retain their precise pixel scopes.

This fills the original-release visible JPEG/PNG/GIF Open/manipulate/replace
trace in W06. It is not a native file-drop-position trace or a monitor/profile
transition check. Wide-gamut/CMYK and broader codec claims remain scoped to their
existing decoder evidence.

Fresh regression after the Open correction: build,3,051 unit tests,72 full
production cases,52 full compatibility cases and24 focused file/image visual
cases pass. Logs are retained. This is not the final whole-project acceptance
gate; the remaining ledger requirements still apply.

The local website was then refreshed from committed source `9ce75cd` and
committed in douglaslab.org as `d337863`. Its updater independently reran3,051
unit and72 production cases. All223 packaged/HTTP-served asset hashes and both
native download hashes were verified; `/gelbox/` and `/gelbox/app/` return200.
`website-release.json` records this deployment-path build separately from the
first compiled replay build. Publication remains deferred.

Follow-up verification at source `6366064`: the full visual suite completed with
955 passes and one intentional skip (`full-visual.log.gz`). A focused independent
code review found no critical or important issues. Its minor GIF-test concern
was addressed by the first-frame pixel assertions above; all four focused cases
pass (the two `first-frame-*.log.gz` files). These test/evidence-only changes do
not require a website bundle refresh and do not close the remaining ledger items.
