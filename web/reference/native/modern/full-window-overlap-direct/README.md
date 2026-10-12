# Native full-window overlap with Render disabled

This repeats the six image/species/loupe overlap stages from
[the effects-mode reference](../full-window-overlap/README.md), after sending
Cmd-R through GelboxApp's native keyboard handler at initialized update 30.
Every exported state and the probe assert that Render is disabled.

The probe schedules actions/captures by native update count, then captures the
completed framebuffer once per count. This distinction matters: OS window callbacks
can draw before app setup, and direct rendering can have a different update/draw
cadence. A first-draw shortcut was therefore ineffective; a diagnostic dereference
there crashed before setup. Draw-count scheduling later produced different particle
ages across repeats. Neither preliminary result is retained as reference evidence.
The final counter observes updates; it does not alter timestep, RNG, simulation,
interaction handlers or drawing. The ordinary sample is seeded/prerolled once,
as in the effects-mode reference, and capture-time particles are exported.

Reconstruct with `../rebuild.py`, run
`python3 instrument.py --source <build>/source`, then rebuild. Create an output
directory and launch with `GEL_OVERLAP_CAPTURE=<output>` and
`GEL_OVERLAP_IMAGE=<absolute path to ../shared-image-scenes/alpha.png>`.
Dismiss macOS's stale restoration prompt with Don't Reopen if shown. The probe
captures updates 90–240 and quits. Portable instrumentation reproduces the compiled
sources from the original hashed inputs; hashes are recorded in `manifest.json`.

All twelve PNG/state files repeat byte-for-byte across two successful launches.
The actual web application follows the same shortcut and overlap actions, importing
the captured document and replaying the exported particles. All six full-window
RGB comparisons pass exactly on each backend at 1365×768/DPR2, without crops,
masks or tolerance. See [web evidence](../../../web/shared-overlap-direct/README.md).

This covers controlled rendering and this interaction sequence, not unrestricted
RNG histories, the original-release full GUI, other sizes/platforms or production
shared rendering. Those remain separate gates.
