# Overlapping aggregate drag — unresolved discrepancy

This is failing evidence, not a completed parity case.

Original executable SHA-256:
037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7.
The isolated copy changes only its bundle identifier; see original-app-provenance.json.

Input: one 3000bp species, mass200, aggregate [1,1,1], time0.1, voltage70.
Original native CUA at 2730×1592 (1365×768 client plus28 logical titlebar):
open input.json, press ordinary a, drag physical (472,354)→(472,394),
then Command-S. Native shows 900bp and saves Bases922 in native-overlap-drag.json.

The compiled replay converts those to client (236,149)→(236,169). At the
starting point, two of the three band UI bounds overlap. All four browser/backend
configurations produce Bases1001, so the exact-document test fails. Native also
rounds input Time0.1 to float32 0.10000000149011612, whereas the web retains0.1.
Both differences remain visible in the retained failure logs; neither was
normalized away. Runtime code is unchanged.

A source-model diagnostic narrows the next investigation:

- The web simulation produces the same band and UI rectangles at both time0.1
  and its float32 value. Both overlapping hit heights are equal, so its picking
  rule chooses the first, aggregate2.
- The existing pinned GelSim native harness produces matching rectangles and
  solves aggregate2 at target45 to1001; aggregate3 at target40 solves to922.
- Thus the original saved result is consistent with choosing aggregate3, but
  that is an inference. It also matches a larger movement for aggregate2.
  It does not yet prove which event coordinates or band the original received.
- The native model is a pinned-source/modern-Cinder reference, not the original
  executable. Its agreement with the web cannot overrule the original GUI save.

Next: repeat from the same input at trimer-only and dimer-only grab points with
identical vertical deltas, then repeat the overlapping point. This separates
original picking/geometry from solver or input-delivery differences before any
product correction. No picking tolerance, tie policy or expected result has
been changed to make the test pass.

Diagnostic invocation used the existing /tmp/gel-native-numerical/build/gel-numerical,
its pinned gel-sim and molecular-sim tuning, and native-model-case.json. The web
diagnostic was bundled with the installed esbuild and run with Node. The native
harness provenance is retained alongside that build; these diagnostic files are
investigative evidence, not a new independently qualified native capture corpus.

## Independent tier controls

From a fresh input.json each time, the original GUI now also saves:

- (472,350)→(472,390), trimer-only grab: native-trimer-only.json, Bases922.
- (472,364)→(472,404), dimer-only grab: native-dimer-only.json, Bases1001.

Both use the same40 physical-pixel delta. This supports the tier-selection
hypothesis and independently confirms each solver result at this time. A repeated
overlap observation and original geometry/order attribution are still outstanding.

Read-only disassembly of the original mouseDown function is retained in
original-mousedown.asm. Its minimum-height loop subtracts the endpoints at
0x10000d956, compares against the current minimum, and branches past replacement
on greater-or-equal at0x10000d95e. This supports retaining strict less-than tie
handling; changing web picking to prefer the last equal-height band would not
be justified by the original executable.

An additional model control constructs well endpoints with the source float32
Rect offsetCenterTo sequence instead of double-precision symmetric endpoints.
It changes the well's y2 by one float32 ULP, but the model still gives equal
aggregate2/3 UI heights. Thus that endpoint discrepancy alone does not explain
the GUI behavior. Inputs and output are retained as native-well-case/result.json.
No product fix has been made; the original failing test remains enabled.

## Overlap boundary and architecture controls

Fresh native replays at physical (472,356)→(472,396) and
(472,358)→(472,398) both save Bases922. These neighboring overlap points are
retained separately; the original discrepancy is not confined to one start point.

The unchanged pinned numerical harness was separately built for x86_64 under
/tmp/gel-native-numerical-x86-overlap with CMAKE_OSX_ARCHITECTURES=x86_64.
Its complete case output equals the existing arm64 model output exactly. Build
logs, compile flags and input/source/library/executable hashes are retained.
This rules out architecture alone for this model case, not every compiler or
original-build difference. The original bundled gel-sim tuning also compares
byte-identical to the pinned harness tuning.

Original geometry disassembly exposes a different evaluation order for band
inflation (well height before translation). Two temporary bundle-only controls
tried that ordering with the existing and source-float32 well endpoints. Both
still pick aggregate2, so this observation alone is insufficient for a fix.
Their outputs and diagnostic transformation are retained; repository runtime
source was not changed.

A read-only LLDB attach to isolated PID3764 remained pending without producing
an image list or band data. It was interrupted and then the debugger process
was terminated (exit143); the native application was not intentionally terminated.
No security preference was changed. This attempt supplies no geometry evidence.
The precise original-band heights/order or delivered pick location still need
measurement; do not infer them from the saved base count alone.
