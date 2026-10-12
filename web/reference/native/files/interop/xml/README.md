# Native XML constructor comparisons

The parent command-line harness now selects pinned `Sample::Sample(XmlTree)`
for `.xml` inputs and exports through native `Sample::toJson()`. No XML loading
logic is copied into the driver. Cinder XML parsing comes from the retained
release library; the modern toolchain/original-executable limitations remain.

Build using `../build.py`, then run this directory's `capture.py`. Four safe
input documents are parsed and exported twice; stdout/stderr must repeat
identically. `captures.json` records all hashes and native diagnostics.

| Fixture | Independent native behavior checked |
|---|---|
| fields | Unicode/entity metadata, fractional values, hex colors including `0x`, uppercase `0X` and surrounding whitespace; native ignores id, Buffer, Dye and AspectRatio |
| defaults | Missing values retain native defaults; Color without value becomes black; incomplete Aggregate logs/skips |
| ignored-children | Only Fragment children are imported; unrelated children are ignored |
| empty | Empty sample has no fragments |

The web rejected the prefixed hex color before correction. It now accepts
conventional 24-bit hexadecimal values with optional `0x` prefix and surrounding
whitespace. The browser comparisons use the native writer's six-significant-
digit number representation, explicitly matching serialization rather than
applying an arbitrary numeric tolerance. Empty [] and native null collections
are compared as equivalent representations.

## XML boundaries and remaining work

The browser test confirms that a DOMParser parse of an external DTD declaration
makes no request to the intercepted external URL (including two subsequent
animation frames). It also verifies rejection of negative, positive and very
large Aggregate Size indices. Existing GUI file tests cover unsafe-aggregate
error presentation and malformed XML rejection.

The native aggregate loader reads integer Size and Weight, resizes to Size,
then writes at [Size]. Any new positive index is out of bounds; a negative
index is also unsafe. Only index 0 of the default monomer vector is safe.
We do not execute those undefined-memory cases or emulate them in the browser;
the existing error directs users to JSON for multimers. Nonintegral weights
and malformed numeric/color tokens remain subject to the web's stricter
validation. Native partial-token numeric coercions are not certified by these
fixtures and remain an explicit interoperability boundary to review.

This is constructor-level evidence for four supported documents, not complete
legacy-format certification. Native XML writer round trips, all numeric token
forms, broader entity/DTD behavior, native application dispatch and composed
GUI workflows remain outside this check. JSON remains the interchange path
that preserves buffer, dye, aspect and ID fields which the native XML reader
itself ignores.
