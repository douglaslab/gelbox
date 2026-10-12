# Building Gelbox on Windows

The Windows build runs on a PC with Visual Studio 2022 Build Tools (workload
"Desktop development with C++" with recommended components, which brings MSVC,
the Windows 11 SDK, CMake and Ninja) and Git for Windows. Both install with
winget:

    winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
    winget install --id Git.Git --exact

Cinder master (commit f90f332d1) is cloned and built next to the gelbox
checkout, so the layout is C:\Users\<you>\code\Cinder and
C:\Users\<you>\code\gelbox. See tools\win\build-cinder.cmd and
tools\win\build.cmd; both call vcvars64.bat themselves, so they work from any
shell, including an SSH session.

The lab PC for this is ndskpc1 on the tailnet (ssh ndskpc1). Its SSH shell is
Windows PowerShell 5.1 with execution policy Restricted; run PowerShell scripts
as `powershell -ExecutionPolicy Bypass -File <script>`.

Verified on ndskpc1: Visual Studio Build Tools 17.14.41, MSVC 19.44.35229
for x64, Windows SDK 10.0.26100, CMake 3.31.6-msvc6, Ninja 1.12.1, and
Git 2.55.0.windows.5. Both winget installs returned 0; no reboot was needed.

Cinder at this revision writes the library to
`lib\msw\x64\<config>\v143\cinder.lib`, while `cinderConfig.cmake`
lives one directory above it. A check for `<config>\cinder.lib` incorrectly
reports failure after a successful build; the wrapper checks both real outputs.
The initial Release build emitted upstream C4267 (ObjLoader), C4312 (FreeType),
and LNK4006 duplicate import-descriptor warnings. No warnings were disabled.

MSVC C2065 in ColorPaletteView, GelView, and Slider came from `MAXFLOAT`, a
nonstandard platform macro. Use `<limits>` and `std::numeric_limits<float>::max()`
for the nearest-item search sentinel on both platforms.

MSVC C2926 rejects default member initializers in the anonymous struct
inside Buffer’s union. The default constructor now zero-initializes `mValue`
as a whole, preserving zero concentrations for default buffers and presets.

Cinder at the pinned revision filters JSON in its Windows save dialog but does
not supply a default extension. Gelbox uses a Windows JSON save dialog with
`lpstrDefExt` set to `json`, so extensionless names remain reopenable and native
overwrite confirmation checks the final `.json` filename. Both sample and gel
saves use this dialog; the Mac save panel is unchanged.
Include `<windows.h>` before `<commdlg.h>`: Cinder forward declarations alone
are insufficient for the SDK dialog structures and cause a cascade of C2059,
C2146 and C3646 errors in `prsht.h`. No warning suppression is needed.

The native Windows renderer explicitly requests 4x MSAA, matching the Mac.
Cinder defaults to zero samples; the previous Windows-only version request
omitted MSAA and made molecular circles jagged. Startup logs report the actual
OpenGL renderer and sample count so a driver fallback is visible.

For hot reload, edit the copies in `build-win-Release\assets` (or the Debug
build directory). These are the live files beside the executable; edits to the
repository assets are copied over on the next build. Restore experimental edits
before packaging. Verified by changing `H2ODistort.Faint` in the copied
`tuning\gel-render.json`: the running gel changed immediately and returned to
the identical image when the original bytes were restored.

See [TESTING.md](TESTING.md) for the Windows port verification record and remaining checks.

Loading a new gel closes the existing gel settings panel. The buffer editor
holds its own gel reference; retaining that panel after a load displayed and
edited the previous gel instead of the newly loaded one. Reopening the panel
now binds it to the current gel. This fix applies on both platforms.

### Linker cannot open Gelbox.exe

`LNK1104: cannot open file Gelbox.exe` can mean the previous test app is still
running. Run `stop.ps1` before rebuilding; Windows locks running executables.
The Task 11 build compiled successfully, then linked successfully after stopping
the test instance. No compiler or warning workaround is needed.

### Rendering parity

Task 11 compared the eight-lane fixture in `research/parity/parity.json` on
Apple M5 Max and Intel Arc 140T, both with 4x MSAA. It contains the bundled
1 kb ladder in lanes 1 and 4, two custom samples, 60 minutes and 70 V.
The app accepts existing file paths as positional command-line arguments;
`run.ps1 -Open` now loads the requested file at startup.

Normalize the Mac Retina capture to the 1365×768 logical client size with
2×2 box averaging; crop Windows to its 1365×768 client. Compare the gel below
the well outlines (client rectangle `208,149,390,495`). Well outlines are UI
strokes with different Retina pixel coverage, not DNA bands. Including them
biases the brightness-weighted centroid toward the wells.

```sh
python3 -I tools/compare-renders.py mac.png windows.png --gel 208,149,390,495
python3 -m unittest discover -s tools/tests -v
```

Measured mean grayscale difference: **0.0861 / 255** (limit 6).
Maximum populated-lane centroid difference: **0.1568 px** (limit 3).
All four empty lanes remain empty. Native Intel OpenGL passes; ANGLE is not
needed. The comparison exits nonzero on a failed threshold or a missing band.
Pillow and NumPy are required for this developer tool.

### Packaging

Install Inno Setup 6 (`winget install --id JRSoftware.InnoSetup --exact`),
stop the test app, then run `tools\win\package.cmd 1.0.2`. The unsigned
installer is written to `dist\Gelbox-Setup-1.0.2.exe`. The wrapper finds Inno
in its machine or per-user install location (winget installed 6.7.3 per-user
on ndskpc1). Cinder/Gelbox use the static MSVC runtime (`-MT`).
The installer supports all-user or per-user installation and deliberately
does not claim the generic `.json` file association.

Installer verification on ndskpc1: all-user installation and uninstallation
exit 0; the Start menu shortcut is created and removed. All 99 installed asset
files match the build by SHA-256. The installed app launches with eleven asset
loads, four MSAA samples and no startup errors. Silent Inno execution directly
in SSH session 0 returned initialization exit 1 without a log; running the same
command through an interactive scheduled task at highest privilege passed.

### Signing status

Shawn chose to distribute without developer signing on 2026-10-11. The Windows
executable and installer are **unsigned**. Windows may show SmartScreen or an
“Unknown publisher” warning. No certificate enrollment or purchase is required
for this release. The download page must disclose this status and provide
SHA-256 checksums. Signing can be added later; no credentials or signing
configuration are stored in this repository.

### Continuous integration and downloads

The `windows` GitHub Actions workflow builds the pinned Cinder revision on
`windows-2022`, caches it, builds Gelbox and uploads executable plus assets.
The first run passed: https://github.com/douglaslab/gelbox/actions/runs/38207870780.
The compressed artifact is about1.7MB; installed assets occupy more space.

Public downloads: https://douglaslab.org/gelbox/ and
https://github.com/douglaslab/gelbox/releases. Version1.0.2 is unsigned.
Remote development helpers require an unlocked console session. Use
`run.ps1`, `screenshot.ps1` and `stop.ps1`; remove the `GelboxShot` task after
screenshots with `Unregister-ScheduledTask GelboxShot -Confirm:$false`.
