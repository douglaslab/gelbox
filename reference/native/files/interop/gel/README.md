# Whole Gel JSON reader and edit/save evidence

The parent harness now compiles pinned original Gel.cpp and GelSim.cpp alongside
Sample.cpp. `capture.py` repeats both original writer output and a diagnostic
snapshot of the actual loaded native fields. `--gel-state` does not use
Gel::toJson: this separates reader behavior from the writer problem below.

Run from the repository root after the parent build:

```sh
python3 reference/native/files/interop/gel/capture.py
python3 reference/native/files/interop/gel/verify-roundtrip.py
```

Four fixtures cover twelve mixed lanes (including a populated empty sample and
an occupied final lane), two lanes padded to seven, twenty-two slots retained
behind twenty visible lanes, and an explicitly empty Samples array. Native
state is compared exactly with the web decoder in both browser backends. The
fixture numbers are exactly representable; signed integer IDs are not rounded.
Exports contain only visible lanes, as the native Gel writer's loop specifies.

The browser also imports the twelve-lane document, selects the first fragment,
edits mass through its slider, and downloads Save Gel. Every other field,
including all other lanes, Unicode names, IDs, icons, dyes, aggregates, buffers,
time, voltage and well damage, is checked unchanged. Both retained downloads
are reread twice by the native constructor. `verify-roundtrip.py` checks every
loaded field against the exact retained JsonTree numeric conversion: real JSON
tokens pass through six significant digits, then native float storage; integer
tokens preserve decimal text before conversion. Integer IDs/Bases stay integers.
No numerical tolerance is used.

## Harness boundaries and writer issue

Original Gel construction reads layout members before the application sets
them. The recorded `../gel-layout-initialization.patch` initializes those four
members to application defaults for deterministic headless construction. No
Gel.cpp or GelSim.cpp algorithm is changed. Inputs lacking Samples are rejected
by the harness: initialized lane count without populated storage would still
make native band synchronization unsafe. Earlier source-only claims that absent
Samples was safely supported were too broad. Web acceptance is a safe extension,
not independently demonstrated original native behavior.

The retained Cinder JsonTree::pushBack changes an array into an object when its
last child has a key. Native Sample::toJson returns a child keyed `Sample`.
Consequently, the mixed fixture's original Gel writer emits Samples as an
object; duplicate keys collapse lanes. Raw `*-native.json` artifacts preserve
this observation. They are not used as valid array fixtures. Subsequent
[original-release replay](release/README.md) confirms the defect, and the web
now imports the surviving object children in native order. `captures.json` distinguishes writer entry count/type from actual
visible lanes and retained slots. The web continues exporting all visible lanes
as an array. The original-release replay confirms this data loss. It remains an explicit
export parity exception: web saves preserve all visible lanes.

This finite corpus does not certify original-release equivalence, native GUI
file dispatch/dialogs beyond the linked release replay, missing-Samples
construction, malformed coercions, or
save/reload after all composed editing workflows.
