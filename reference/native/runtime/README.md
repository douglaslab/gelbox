# Shared runtime investigation

Source audit, exploratory probe and composed reference, 2026-10-09. This is evidence for
the remaining runtime work, **not completed application parity**. Source pins
and probe hashes are in `seed-probe-provenance.json`.

## Confirmed native rules

- Cinder 0.9.0 `src/cinder/Rand.cpp` initializes the global MT19937 with 310;
  default local `Rand` initializes with 214. A search of both original and
  pinned modern Cinder app startup sources found no `Rand::randomize` or
  `randSeed` call. The Gelbox source has no explicit call to either. This is
  source evidence, not an observed original GUI startup trace.
- `SampleView` owns `MolecularSim` before its local `Rand`. The molecular
  constructor draws one global signed integer, then `SampleView::setup`
  draws another to seed the view-local stream. This also happens for loupes,
  even though their streams are subsequently reset from the anchor/time seed.
- `FragmentView::makeSliders` draws seven global floats for initial aggregate
  graph values under the pinned default tuning. Overwriting those graph
  values from the model does not undo the random draws.
- `SampleView::newFragment` draws from the view-local stream: palette integer,
  two base-count floats, mass float, aspect-chance float, multimer-chance
  float. The last two draws still happen with both chances set to zero.
  Base interpolation and mass use native float arithmetic.
- `Palette::getRandomColor` uses `int i % size()`. On the reference 64-bit
  platform, negative signed integers convert to unsigned `size_t` before
  modulo. A floating-point palette selection is not equivalent.
- Alt band cloning draws its palette choice from the global stream.
  Right-click creation first selects/opens the sample view, then invokes
  its local generator, then solves the base count and selects the result.
- Particle angular velocity consumes the global stream; the remaining
  particle random fields use the molecular engine stream. Loupe preroll
  therefore affects subsequent global draws even when its time scale is zero.
- `ViewCollection::tick` snapshots ordered weak references, then ticks each
  still-live view. Newly inserted views wait until the next frame. Removing a
  view skips it only if its lifetime ends; removal alone is not that guarantee.
  `GelboxApp::update` invokes this with 0.1 before interaction updates and
  deferred menu closure.

## Compiled probe

`seed-probe.cpp` contains the unchanged native molecular constructor and
palette method behind minimal types. All other sequencing is scripted and
explicitly does not certify GUI orchestration. Two process executions agreed.

The first ordinary view receives molecular seed **-779453450** and view seed
**-1593094532**. Opening a loupe next gives molecular seed **-1423486980**.
Inserting the inspector's seven draws first changes that seed to
**-970001149**. The ordinary view's first palette index remains **4**, because
it uses its own stream. Full output is in `seed-probe-output.txt`.

To reproduce on the pinned Cinder checkout, create a scratch CMake project
with C++17, include `Cinder/lib/macosx/Release/cinderConfig.cmake`, add this
probe as an executable, and link target `cinder`. Configure Release and run
twice. No native checkout changes are required. This exploratory probe will
need a maintained extraction/verification harness before serving as a gate.

## Verified web mismatches

At web commit `28dc48e`:

- `MolecularSim` already has a shared global RNG, but `MolecularSimCanvas`
  supplies `laneIndex * 31 + 1`, bypassing constructor seed draws.
- `newFragment.ts` uses four `Math.random` draws and double arithmetic;
  it has no persistent native view-local random stream.
- `SampleSimCanvas` owns engine creation and detail preroll in React effects.
  Effect replay can repeat work that native view creation performs once.
- Each canvas advances independently in its animation callback, and only
  after its renderer is available. GPU acquisition and effect scheduling can
  therefore determine global random consumption order.
- The existing native particle driver explicitly seeds individual engines
  and resets global RNG after construction. Its passing cases prove engine
  formulas, not application constructor/event/frame sequencing.

## Implementation consequence and next evidence

Replacing lane seeds alone cannot fix this. Keep the verified numerical
engine, but establish an application-owned lifetime/order boundary for
random streams and molecular views, independent of GPU readiness and React
effect replay. Document state can remain in the existing reducer. Native
creation, selection, inspector, preview-refresh and frame transitions must
drive the runtime synchronously rather than be inferred from canvas mounts.

The composed reference below now supplies those lower-level sequences. Next,
use them to define and test the web runtime's ordered operations, then connect
native application commands to those operations. Include delayed GPU
initialization and React StrictMode in the web integration tests. Native GUI
replay remains necessary to verify the scripted event sequences themselves.

## Maintained composed reference

Run from the web repository root:

```sh
python3 reference/native/runtime/build.py --build /tmp/gel-native-runtime
python3 -m unittest discover -s reference/native/runtime -p 'test_*.py'
```

The first command requires the pinned clean Cinder checkout/library and native
Git objects. It writes only this directory's `outputs.json` and `provenance.json`
plus isolated scratch build files. The second command verifies the committed
capture without building native code. The eight contracts cover 16 scenarios:

- Ordinary/loupe constructor ordering, with and without inspector draws.
- Two consecutive local species generations, including exact float arithmetic
  and six draws per species under zero aspect/multimer probabilities.
- Global palette selection with a negative integer and palette draws between
  ordinary and loupe creation (the RNG portion of Alt cloning).
- Repeated paused loupe refresh/preroll with identical local seed/sample but
  advancing global angular velocities. Initial particle age is randomized;
  a paused view retains that initial age, rather than resetting it to zero.
- Two molecular views ticking in forward and reversed order.
- Collection insertion, destruction, retained removal and raising during a tick.
- Ordinary view replacement, idempotent inspector opening, inspector reopening,
  and a composed species edit/inspector/tick/loupe refresh/removal sequence.

Captured fields include all particle fields, fragments, view and molecular
seeds, non-consuming local-stream probes, ordered tick traces, species change
notifications and the terminal global integer. Independent seeded traces
verify draw counts. Literal constructor/global-palette expectations and a
fixed digest of native source/extraction/Cinder hashes prevent regeneration
from silently changing the reference contract. The reused molecular adapter
has its own fixed hash. Two executions of each capture must agree byte-for-byte.

The whole molecular constructor/algorithms, `SampleView::newFragment`, palette
methods and `ViewCollection::tick` are extracted unchanged. View setup includes
the original seed statement with a local observer that records its returned
integer without an extra draw. Inspector setup includes only graph allocation
and its random initialization loop. Member order matches native. The headless
`View` adapter supplies ownership and a molecular tick; it does not execute
the complete native `SampleView::tick` UI logic.

`fragmentDidChange` records a notification; it does not implement native GUI
callbacks. Loupe refresh is explicit and receives a supplied sample or a copy
of a source view's current sample. Native band-to-loupe extraction remains
covered by the separate numerical harness. These are composed algorithm and
collection-lifetime references, **not native GUI workflow certification**.
Modern Cinder/toolchain limitations also remain. Product code is unchanged by
this reference increment.
