# Native sample JSON interoperability

This command-line harness compiles **pinned original Sample.cpp and headers**,
plus verbatim Buffer constructor/writer functions, against Cinder's retained
JsonTree/jsoncpp implementation. It does not use the web decoder or the modern
native rebuild's replacement JSON adapter. Buffer's unrelated GUI icon loader
is excluded. Build and capture provenance records source/executable hashes and
limitations.

From the repository root:

```sh
python3 reference/native/files/interop/build.py
python3 reference/native/files/interop/capture.py
python3 reference/native/files/interop/verify-roundtrip.py
```

The build script uses the recorded local gelbox/Cinder checkouts and writes
only `/tmp/gel-native-file-interop`. It requires the pinned clean Cinder checkout
and its existing release library. Capture repeats each native export twice and
requires byte-identical output. The application file header is added by the
capture wrapper; the Sample payload is produced by native `Sample::toJson`.

## Empty collections

The independent writer emits `Fragments: null` for the empty sample. Native's
constructor iterates zero children and accepts it. The web importer previously
rejected the native-generated file. It now accepts null fragment and aggregate
collections, retaining the distinction between absent Aggregate (default [1])
and null Aggregate (empty). Native Gel's constructor also accepts absent/null
Samples; the web pads those to seven empty lanes. The Gel behavior is supported
by pinned source inspection, **not execution of Gel in this sample harness**.
Color arrays and malformed scalar/element values keep their existing validation.
Web exports may write [] for an empty collection; native accepts that equivalent
representation. Four unit regressions failed before the correction and pass
now. Browser checks import the native empty sample and save its metadata intact.

## Edited mixed sample round trip

The native-generated mixed fixture includes a Unicode name, icon metadata,
maximum signed 32-bit ID, a non-preset buffer, degraded DNA, a multimer weight
vector and all four dyes. The browser imports it, edits the first DNA mass via
the actual slider and downloads Save Selected Sample. Both backend exports are
retained. All fields except the deliberately edited mass are exactly unchanged
in the web export, and the independent native reader accepts both files.

The native numeric conversion is explicitly recorded, not hidden by a tolerance:

- Web edited mass: 117.57998083587876.
- Loaded native float: 117.58000183105469.
- Native writer JSON: 117.58.

Retained `JsonTree::deserialize` converts a real-valued JSON token with
`ci::toString(value.asDouble())`, using default stream precision 6; then
`getValue<float>` parses that string. The diagnostic `--mass-values` mode reads
actual loaded native fields with precision 17, separately from the native
writer. `verify-roundtrip.py` checks exact expected conversion for these
real-valued fixture masses and exact equality for all other fields. This is
native reader quantization, not a web export mutation. The web importer was not
changed to impose this old reader's numeric rounding.

## Limits

This is finite sample interchange evidence, not full native application replay.
It does not execute Gel construction, application dispatch, XML import, native
file dialogs, or save/reload after broader composed edits. Modern compiler and
retained Cinder library behavior do not prove original-release equivalence.
Malformed-data coercions and numeric precision across native toolchains remain
explicit boundaries for the final interoperability review.
