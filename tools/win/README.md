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
