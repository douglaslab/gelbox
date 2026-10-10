# Application runtime integration

Goal: complete the native runtime correction in the actual web app while
preserving strict native behavior/visual parity and the full ROADMAP gates.
The reviewed molecular foundation at `4e02c63` already passes 16 independent
native sequences. It is not yet used by the application.

## Ownership and React boundary

Use an application-owned `GelStore`, retaining the pure `gelReducer` for
document transformations. Commands execute synchronously against the latest
state, applying native runtime effects in order before publishing one stable
snapshot. React subscribes using `useSyncExternalStore`. Each provider owns its
own store/RNG; StrictMode effect replay cannot recreate logical views or
preroll them. Provider effects own only listeners and one application RAF.

The store owns ordinary, persistent and hover molecular views; derived loupe
samples; hover reducer state; and logical stacking order. A unique internal
instance key distinguishes a closing hover/loupe from an immediately recreated
logical view. Ordinary views are placed immediately above gel. Persistent
loupe refresh follows creation order, independently of stacking order.

Canvases receive existing `MolecularView` objects. They acquire/draw/dispose GPU
resources and forward pointer positions. They do not create engines, reseed,
preroll or tick. Application frames snapshot logical molecular order, perform
GelView selection-following, then tick views and draw available surfaces.
Renderer readiness has no influence on simulation. Existing test freeze
controls remain per-view counters; owner lifecycle work still runs while frozen.

## Native command ordering

Preserve the following source-backed rules (`GelView.cpp`, `SampleView.cpp` at
native `5f51097`):

- Opening/replacing an ordinary view consumes constructor/setup RNG before
  creating an empty lane sample and notifying loupes. Closing it is immediate.
- New species: use current view-local RNG, append, notify loupes, update the
  ordinary engine, then select and open its inspector. Right-click first opens
  the lane, generates and notifies, solves bases and notifies again, selects,
  and begins native band dragging on pointer-down. Contextmenu only suppresses
  browser UI. Preserve the first-species temporary-lane deletion behavior.
- Alt clone: global palette draw, append and notify loupes, then select/open.
  Existing ordinary engine fragment metadata stays stale until its next tick;
  selecting the new index may therefore close the inspector until that tick.
- Tube movement: notify after removing the old placement; notify after adding
  a new placement when possible; select/replace the ordinary view; notify again.
  Keep intermediate document projections separate from the final published
  state. Cross-lane band moves select the destination before their final
  samplesChanged notification.
- Other gel/sample changes refresh persistent loupes in creation order, then
  hover. Ordinary immutable sample revisions are synchronized before its next
  molecular tick, except native explicit setSample/newFragment paths.
- Explicit ordinary fragment selection updates inspector lifetime immediately.
  Rollover updates the inspector after the ordinary molecular tick. Particle
  rollover picking repeats each frame at the current logical pointer location.
- Native closing loupes receive one final tick before disposal (frame
  interpolation is disabled in the pinned source). A closing persistent loupe
  remains in the weak creation list until disposal and can receive a refresh.
- Hover capture events retain the native pre-clear mouse-down refresh window;
  release restores rollover only after drag edits. Pointer/key refreshes run
  synchronously, without React batching away intermediate random consumption.

Reference images/nonmolecular layers retain their current behavior. Presentational
mount/unmount effects must not own managed molecular/inspector layer lifetimes.
Keep numerical formulas, serialization, native reference captures and unsupported
platform decisions unchanged.

## Verification

Unit contracts exercise synchronous commands, intermediate notification order,
local/global RNG checkpoints, view replacement, inspector timing, source edits
with loupes, hover refreshes, one final closing tick, and frame-created views
waiting until the next frame. Existing reducer/reference suites remain required.

Browser tests on WebGPU/WebGL2 cover StrictMode remount, delayed renderer
acquisition, actual create/clone/right-drag/save behavior, persistent/hover
loupe updates and toggles, and repeated view lifetimes. Run the full browser
suite. Inspect every changed particle/loupe screenshot before updating any
baseline; numerical/interaction expectations may not be weakened for a green
suite. Native GUI/raster certification and P5 reliability/release gates remain
required after integration; do not claim those from these tests.
