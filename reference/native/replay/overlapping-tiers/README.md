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
