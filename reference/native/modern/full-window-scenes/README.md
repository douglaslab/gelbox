# Populated native window references

These are complete 1365×768 client-window captures at scale 2 from the recorded
modern compatibility build. `probe.inc` runs after the application's original
draw, opens the first tube through native mouse events, and exports the exact
particle state at the sample and species frames. Native drawing methods are
unchanged. This is controlled-state rendering evidence, not RNG history parity
or certification of the original release toolchain.

Reconstruct a fresh build with `../rebuild.py`, run `instrument.py --source`
against its source directory, and rebuild with `cmake --build <build>/build -j 4`.
Create an output directory, then launch the executable with
`GEL_COMPOSED_CAPTURE=<output>`. If macOS shows the stale window restoration
prompt, choose Don't Reopen. The probe captures frames 30, 60 and 90 and quits.
The only header additions expose the sample simulation and permit diagnostic
access to particle fields; the bundle identifier is distinct from the app.

Two final independent launches produced byte-identical copies of all twelve
capture files. Startup also matches the previous lossless native framebuffer.
Diagnostic exports include expanded mesh rows, window/view/MVP matrices and
individual multisample readings. Adding diagnostics left the original PNGs and
state JSON byte-identical. `manifest.json` records the source, instrumentation,
executable and capture hashes.

The web acceptance test imports the captured gel document through the actual
file UI, then replays exported particles in the app's sample engine, frozen
through the existing test hook. It uses real tube input and the corresponding
species selection command at the same window size. Every RGB channel is compared
with zero tolerance, without a crop or mask.

Both sample and species now match exactly on WebGPU and WebGL2. The comparisons
exposed two implementation differences: native labels format the quantized
float32 slider roundtrip, and native window projection composes projection with
the view transform before transforming vertices. Both are restored. A buffer
boundary also verifies that label conversion preserves native float32 arithmetic
without writing the displayed rounded value back to the model.

The captured document matters: modern Cinder and original-release Cinder convert
palette bytes to float32 differently. Replaying only particles while retaining
the original-release web palette produced twelve one-level gel pixel differences.
The test now imports all captured model inputs; original-release web defaults
remain intact. See `../../replay/palette-values/README.md` for independent release
palette evidence. No native reference pixels or comparison tolerances changed.

This establishes two controlled populated scenes at 1365×768/DPR2, not complete
workflow, RNG/history, arbitrary-DPR, original-release GUI or production
certification. Full-window settings/menu, overlapping loupes/images and live
interaction histories remain acceptance work. The shared compositor is still
restricted to development.
