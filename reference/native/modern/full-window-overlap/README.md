# Native full-window image, species and loupe overlap

Six complete 1365×768/DPR2 frames exercise an image behind a newly opened species
inspector, another image in front of it, creation of a persistent loupe, an image
covering that loupe, and a click that raises the loupe. Images use the existing
128×64 RGBA fixture, loaded through native file-drop handling and resized through
real mouse events. Loupe creation and raising also use native mouse events.
Species selection uses the existing native selection command.

The probe runs after the original draw. It exports the complete gel document and
capture-time particles for the ordinary sample and loupe. The ordinary sample is
seeded/prerolled once for repeatability; native drawing is unchanged. `active`
records whether these known child views still have their native parent. The final
background click retains a derived sample with fragment -1, so GelView::tick
closes the ordinary sample/inspector while keeping the loupe focused and raised.

Reconstruct with `../rebuild.py`, instrument a fresh source directory with
`python3 instrument.py --source <build>/source`, then rebuild. Create an output
directory and launch the executable with `GEL_OVERLAP_CAPTURE=<output>` and
`GEL_OVERLAP_IMAGE=<absolute path to ../shared-image-scenes/alpha.png>`. Dismiss
macOS's stale restoration prompt with Don't Reopen if shown. The probe captures
frames 90–240 and quits.

Twelve PNG/state files repeat byte-for-byte across independent successful launches.
The portable instrument reproduces the compiled sources from the original hashed
inputs. `manifest.json` records reconstruction, instrumentation, source, executable,
image and capture hashes. Particle-state replay is controlled rendering evidence,
not proof of matching RNG histories. This is a modern compatibility build, not
original-release full GUI certification.

All six complete scenes now match exactly on both backends. The final background
click exposed the missing retained derived-sample reference in the web app; that
behavior is restored without changing native images or comparison tolerances.
See [retained web evidence](../../../web/shared-overlap-window/README.md). Broader
RNG histories, original-release GUI, production and platform gates remain open.
