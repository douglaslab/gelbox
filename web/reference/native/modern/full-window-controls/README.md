# Complete native settings and menu windows

Six complete 1365×768/DPR2 client frames were captured from the recorded modern
compatibility build. The five new scenes cover gel settings, settings with the
application menu, those controls with Render disabled, the menu after closing
settings, and the menu after re-enabling Render. Startup is retained as a control.

The probe runs after the original application draw. All transitions use the real
mouse event handlers and control geometry. No rendering method or model default
is changed. Closing the menu outside schedules work for the next native tick;
the probe waits before reopening it, as an actual subsequent user click would.
There are no samples or particle state overrides in these scenes.

Reconstruct a fresh build with `../rebuild.py`, then run
`python3 instrument.py --source <build>/source` and
`cmake --build <build>/build -j 4`. Create an output directory and run the built
executable with `GEL_CONTROLS_CAPTURE=<output>`. Dismiss macOS's stale restoration
prompt with Don't Reopen if shown. It captures frames 30–180 and quits.

`manifest.json` pins the base reconstruction, probe/instrument, two altered source
files, executable and twelve capture files. The portable instrument script was
verified to reproduce the compiled inputs from the original hashed inputs.
Two successful independent launches produced byte-identical copies of all twelve
files. Startup agrees with the previously accepted native framebuffer.

The web regression imports the captured gel document, then follows the same real
settings/menu/Render transitions. All five complete RGB comparisons pass exactly
on WebGPU and WebGL2, without crops, masks or tolerance. See
[retained web evidence](../../../web/shared-controls-window/README.md).

This is modern compatibility-build evidence at one window size and DPR. It does
not certify the original-release complete GUI, overlapping images/loupes,
particle/input histories, production shared rendering or the browser/platform
matrix. Those remain separate acceptance gates.
