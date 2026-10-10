# Original-release palette constants

On 2026-10-10, the original Gelbox release (binary SHA256
`037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`)
loaded `capture-input.json`: twelve species, 500 through 11,500 bp, in lane 1.
Each species received the correspondingly indexed palette swatch, row-major.
The 500 bp band was selected at native window (471,987), then blue at (2413,477).
Tab advanced from that selected species to 1,500 bp. Subsequent swatch centers
were `(2413+50*(i%4), 477+50*floor(i/4))`, with Tab between species, ending at
11,500 bp. Save Gel wrote `native-output.json`, retained verbatim.
`native-all-colors.jpg` is a live JPEG observation, not a pixel golden.

All 36 saved color channels match `f32(byte * f32(1/255))` exactly. This differs
from both JavaScript double division and the modern Cinder harness's rounded
float division. It demonstrates the original executable's palette constants;
it does not prove compiler flags or generalize to arbitrary imported colors.
The web's hex palette conversion now uses that matching float computation.
Random species creation shares this same palette without changing RNG behavior.
Imported colors bypass this conversion and retain their existing values.

The exact unit comparison against every captured swatch failed before correction.
Both web backends now replay all twelve edits and save a complete document exactly
equal to `native-output.json`, including all non-color properties. Web outputs
are retained. The initial browser comparisons failed on palette channels (and
on the fixture name issue below); the final comparisons use exact equality.

The older modern-native runtime capture remains unmodified. Tests of generated
species and global palette choices replace only exact known harness palette
entries with the captured original-release entries of the same index, through
`ts/tests/helpers/releasePalette.ts`. Other fragment properties, RNG draws,
notifications, view ordering and particle checks retain their prior assertions.

## Fixture name correction and scope

`capture-input.json` accidentally contained both inherited lowercase `name` =
`Last lane` and uppercase `Name` = `Native palette values`. The native release
saved lowercase `name` = `Native palette values`; web import preferred the
lowercase input field. That case-alias conflict is a separate unresolved file
compatibility case, not a color conversion issue. `input.json`, used by the web
replay, removes the conflicting alias and keeps the native output's canonical
lowercase name. Apart from this explicit name normalization, its twelve color
edits produce the captured native document with no other differences.

Full native visual parity, broader palette interactions, native new-species GUI
RNG replay and all remaining release gates stay open.
