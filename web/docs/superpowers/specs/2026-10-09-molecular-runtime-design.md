# Native molecular runtime foundation

The completion goal remains strict native behavior and visual parity in the
web application, followed by the release gates in `docs/ROADMAP.md`. This
foundation replaces missing ownership/scheduling semantics without changing
the independently verified particle formulas. Application command and canvas
integration follows; this foundation alone does not close the runtime gap.

## Evidence and choice

`reference/native/runtime/README.md` and its 16 compiled native sequences show
that each view consumes two shared RNG integers, each inspector creation seven
floats, and species generation six view-local draws under default settings.
Loupe reseeding does not undo constructor consumption; its preroll advances
global angular-velocity draws. Tick order is a snapshot with explicit view
lifetimes. The current canvas-owned engines and lane seeds cannot preserve
these relationships.

Changing seeds in existing effects would still depend on StrictMode replay
and GPU readiness. Replacing the scientific engine would discard verified
work. Instead introduce a framework-independent molecular runtime, retaining
the existing engine with an injectable global RNG. A subsequent synchronous
application command boundary will own this runtime; React canvases will draw
its existing views without creating or ticking simulations.

## Runtime contract

- Each runtime owns a fresh `CinderRand(310)` unless given an explicit reference
  seed. Independent application instances cannot consume one another's draws.
- `createView(id, {bounds, sample, timeScale})` creates the molecular engine
  against that stream, then seeds a separate view-local stream with the next
  global integer. Duplicate live IDs fail without consuming RNG. Defaults are
  empty sample and time scale 1; ordinary/detail dimensions come from callers.
- A view owns its engine and local stream. `createFragment()` returns native
  palette/base/mass/default fields using six local draws; the caller applies
  the document mutation and notifications. Palette selection uses unsigned
  64-bit conversion before modulo. Floating calculations preserve float32.
- `randomFragmentColor()` on the runtime uses the global stream for Alt cloning.
- `setInspectorOpen(true)` consumes seven floats only on false-to-true.
  Reopening consumes again. Closing a view discards its inspector lifetime.
- `setSample(sample, filter)` updates the retained engine and resets only the
  test freeze counter. It does not reseed the engine or local stream.
- `refreshDetail(anchor, time, sample, filter)` clears particles, applies the
  native loupe seed to both local and molecular streams, sets the sample and
  prerolls. The owner creates detail views with time scale zero.
- `raiseView` changes next-frame order without recreating an engine.
- `tick(beforeViews?)` snapshots ordered view instances before running the
  callback and then ticks still-live entries. Creation during the callback or
  a view tick waits for the next frame. Destroyed entries are skipped. A view
  explicitly detached with retained lifetime still ticks if already captured;
  later `dispose()` ends that lifetime. JavaScript GC is not a scheduler.
- Each view can receive an owner-provided `afterTick` callback for native UI
  work that follows its molecular tick. Bullet-time state is owner supplied.
- Optional `freezeAfter` is a test control for per-view ticks since sample
  change. Simulation never checks GPU readiness. Freeze does not suppress the
  owner's after-tick work.

The engine's existing `seed` and `globalSeed` options remain compatible with
independent reference tests. Add `globalRand` injection; reject simultaneous
`globalSeed` and `globalRand` to prevent ambiguous ownership. RNG cloning must
copy state and cursor without advancing either stream.

## Proof and boundaries

Replay every committed native runtime case against this layer. Compare ordered
view presence, species values/colors, local/global RNG checkpoints and particle
state with the existing particle tolerance (absolute 1e-4 or relative 2e-6).
Discrete fields and RNG integers compare exactly. Test mutation during ticks,
retained removal, destroyed old instances when an ID is reused, independent
runtime instances, freeze behavior and injected-stream ownership.

No product commands are redirected in this foundation increment. Existing web
behavior remains until integration is complete. Required follow-up: synchronous
document/hover event handling, native inspector timing, view ordering, one app
frame driver, presentational canvases, StrictMode/delayed-GPU browser tests,
reviewed visual baseline changes and native composed GUI replay. Do not claim
parity from headless runtime tests alone.
