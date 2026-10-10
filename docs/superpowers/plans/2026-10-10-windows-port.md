# Gelbox Windows Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Gelbox as a native 64-bit Windows application, built from the same source tree and CMake project as the Mac build, delivered as a signed Inno Setup installer.

**Architecture:** Gelbox stays a Cinder application. The existing `proj/cmake` project gains a Windows branch for the icon, the assets folder and the forced-include flag, and Cinder's own Windows backend (Win32 window, OpenGL through WGL) does the rest. Three small source changes make the app portable: a font helper that falls back to a bundled typeface when Avenir is absent, accelerator-key handling that reads Control on Windows and Command on macOS, and a help button that opens the browser through Cinder. Development stays on the Mac; every Windows step runs on the lab PC `ndskpc1` over SSH on the tailnet, and a GitHub Actions runner later guards the Windows compile.

**Tech Stack:** C++20, Cinder master at `f90f332d1`, CMake 3.16+, Ninja, Visual Studio 2022 Build Tools (MSVC v143, Windows 11 SDK), OpenGL 3.3 core (ANGLE over Direct3D held in reserve), Inno Setup 6, GitHub Actions `windows-2022`.

**Spec:** The approach was agreed in conversation on 2026-10-10 and is recorded in the Context section below. There is no separate spec file.

## Global Constraints

- The Mac build must keep working after every task. Run `cmake --build build -j` on the Mac and launch `build/Gelbox.app` before each commit that touches `src/`, `include/` or `proj/cmake/`.
- Windows target is x64 only. Windows 10 21H2 is the minimum supported version, which is what the Windows 11 SDK's default settings produce.
- Cinder is built static with the static CRT (`/MT`), which is Cinder's CMake default on Windows. The installer therefore ships no Visual C++ redistributable.
- No new third-party dependencies beyond Cinder, a bundled OFL-licensed font, and Inno Setup for packaging.
- All Windows commands in this plan run from the Mac through `ssh ndskpc1`. The remote shell is Windows PowerShell 5.1 with execution policy `Restricted`, so scripts run as `powershell -ExecutionPolicy Bypass -File <script>` and build entry points are `.cmd` files invoked through `cmd /c`.
- Nothing in `C:\Users\shawn\code` other than the `Cinder` and `gelbox` directories this plan creates may be touched. The other projects there belong to other work.
- Commit messages follow the repository's existing style: a short imperative subject, then one or two plain paragraphs that say what was wrong and what changed.

## Review Focus

- A user whose Windows account name contains a space or a non-ASCII character saves a gel to their Documents folder and reopens it. The round trip must work; on MSVC `ci::fs` is `std::filesystem`, so the app's `fs::path::string()` conversions are the place this breaks. Task 10 covers it.
- A user on a laptop at 150% display scale opens the app. The UI must pick the @2x images and lay out at the right size instead of rendering tiny or blurry. Task 8 covers it.
- A user double-clicks `Gelbox.exe` from a folder they copied somewhere else. The app must find its assets beside the executable and not abort in the image loader. Task 3 covers it, and the empty-path guard added to `Layout::uiImageWithPath` on 2026-10-10 is the backstop.
- A user presses Ctrl-S expecting a save dialog, and holds Ctrl to see a loupe. Both must work on Windows, where there is no Command key. Task 7 covers it.
- The Intel Arc OpenGL driver on `ndskpc1` renders the gel differently from the Mac, for example missing bands or inverted warps. Task 11 measures this numerically and holds the ANGLE switch as the fallback.

---

## Context

### The Mac build today

Gelbox is a Cinder app. The 2018 Xcode project was replaced on 2026-10-09 by a CMake project in `proj/cmake/CMakeLists.txt` that builds against Cinder master as a sibling checkout (`../Cinder`, known good at `f90f332d1`). The app is pure C++ with no Objective-C and no native menus: file dialogs, drag-and-drop, the help URL and file watching go through Cinder or the standard library. The code already carries one `CINDER_MSW` branch at the bottom of `src/GelboxApp.cpp`, a remnant of Cinder's app template that selects OpenGL 3.3 on Windows.

The survey on 2026-10-10 found exactly these platform-specific points:

| Area | Where | What happens on Windows today |
|---|---|---|
| Fonts | `include/Layout.h:109-128` names `Avenir-Medium` and `Avenir-Heavy` | Cinder throws `FontInvalidNameExc` for an unknown family, so the app aborts at the first text render. |
| Modifier keys | `src/GelboxApp.cpp:660` (shortcuts), `src/GelView.cpp:426` (loupe) use `isMetaDown()` | Meta is the Windows key, so Ctrl-S, Ctrl-O and the loupe never fire. |
| Help button | `src/GelboxApp.cpp:274-279` runs `system("open '<url>'")` | `open` does not exist; a console flashes and nothing happens. |
| High DPI | `src/Layout.cpp:32` picks @2x assets only when the content scale equals exactly 2 | Windows reports 1.25, 1.5 or 1.75, which all fall through to @1x. |
| Forced include | `proj/cmake/CMakeLists.txt:46` passes `-include Gelbox_Prefix.h` | MSVC's flag is `/FI`; without it every translation unit fails to compile. |
| Assets | `proj/cmake/CMakeLists.txt:60-82` links `assets/` into the bundle | No bundle on Windows; the assets folder must be copied beside the executable. |
| Icon | `proj/cmake/Gelbox.icns` | Windows needs a `.ico` and a resource script. |
| Console output | `cout` and `cerr` | A `WIN32` subsystem executable has no console, so the launch diagnostics vanish. |

Things that need no change: `FileWatch` already uses `std::filesystem`; on MSVC Cinder's `ci::fs` is also `std::filesystem`, so the two namespaces the Mac build mixes become one. Shaders are GLSL 150 with Cinder's preprocessor adding the version line. The renderer uses FBOs with single-channel swizzled textures, both core in GL 3.2. `getOpenFilePath`, `getSaveFilePath`, `FileDropEvent` and `launchWebBrowser` are implemented by Cinder on Windows.

### The Windows PC, as found on 2026-10-10

`ndskpc1` is a Lenovo IdeaCentre all-in-one (model F0J20012US) at `100.106.46.41` on the tailnet, reachable as `ssh ndskpc1` with no password prompt. The SSH session lands in Windows PowerShell 5.1 as `ndskpc1\shawn` and carries an administrator token, so installers run without an interactive UAC prompt.

| Item | Value |
|---|---|
| OS | Windows 11 Home, build 26200 (25H2), 64-bit |
| CPU / RAM | Intel Core Ultra 7 255H, 15 GB |
| GPU | Intel Arc 140T integrated, driver 32.0.101.8826 |
| Display | 2560 x 1440 at 96 DPI (100% scale) |
| Disk | 927 GB free on C: |
| Power | Lenovo default scheme, never sleeps on mains |
| Package manager | winget 1.29 |
| Build tools | None. No Visual Studio, Windows SDK, CMake, Git or Ninja. |
| Git | GitHub Desktop 3.6.6 is installed with a bundled git that is not on PATH. |
| Python | Only the Microsoft Store stub. |
| Developer mode | Off, so `mklink` symlinks need elevation. Long paths are enabled. |
| Remote Desktop | Disabled, and Home edition has no RDP host. |
| Desktop session | Nobody is logged on at the console. |

winget can see every package this plan installs: `Microsoft.VisualStudio.2022.BuildTools` 17.14, `Git.Git` 2.55, `JRSoftware.InnoSetup` 6.7. The Build Tools' "Desktop development with C++" workload with recommended components includes MSVC, the Windows 11 SDK, CMake and Ninja, which is why the plan does not install CMake or Ninja separately.

### Working on ndskpc1 remotely

Two facts shape every Windows task. First, a GUI program started from an SSH session runs in session 0 and never appears on the screen, so running Gelbox remotely means Shawn logs on once at the console and the SSH side launches the app into that session through a scheduled task marked interactive. Screenshots come from a second scheduled task that copies the screen to a PNG, which `scp` brings back to the Mac for inspection. Second, MSVC is found through the `vcvars64.bat` environment, so every build runs through a `.cmd` wrapper that calls it first.

For the visual tasks (9, 10, 11) Shawn at the keyboard is faster than the screenshot loop. The plan states which steps need a person at the PC.

---

### Task 1: Provision ndskpc1

**Files:**
- Create: `tools/win/README.md`

**Interfaces:**
- Produces: a machine where `cmd /c "call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" && cl && cmake --version && ninja --version"` succeeds and `git --version` succeeds in a fresh SSH session.

- [ ] **Step 1: Install Visual Studio 2022 Build Tools with the C++ workload**

Run from the Mac. The installer takes 10 to 20 minutes; the `--wait` keeps winget attached until it finishes.

```bash
ssh ndskpc1 'winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --silent --accept-package-agreements --accept-source-agreements --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"; Write-Output "winget exit $LASTEXITCODE"'
```

Expected: ends with `winget exit 0`. Exit `3010` means a reboot is pending and is also fine; reboot with `ssh ndskpc1 "shutdown /r /t 5"` and wait two minutes.

If winget cannot run the installer non-interactively, fall back to the bootstrapper:

```bash
ssh ndskpc1 'Invoke-WebRequest https://aka.ms/vs/17/release/vs_BuildTools.exe -OutFile $env:TEMP\vs_BuildTools.exe; Start-Process $env:TEMP\vs_BuildTools.exe -ArgumentList "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" -Wait -PassThru | Select-Object -ExpandProperty ExitCode'
```

- [ ] **Step 2: Install Git for Windows**

```bash
ssh ndskpc1 'winget install --id Git.Git --exact --silent --accept-package-agreements --accept-source-agreements; Write-Output "winget exit $LASTEXITCODE"'
```

Expected: `winget exit 0`.

- [ ] **Step 3: Verify the toolchain in a fresh session**

PATH changes only reach new sessions, so this is a separate `ssh` invocation.

```bash
ssh ndskpc1 'git --version; cmd /c "call ""C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"" >nul && cl 2>&1 | findstr Version && cmake --version && ninja --version"'
```

Expected output includes `git version 2.55`, `Microsoft (R) C/C++ Optimizing Compiler Version 19.4x` with `for x64`, `cmake version 3.3x`, and a Ninja version of `1.1x`.

- [ ] **Step 4: Record the machine setup for the next person**

Write `tools/win/README.md`:

```markdown
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
```

- [ ] **Step 5: Commit**

```bash
git add tools/win/README.md
git commit -m "Document the Windows build machine setup"
```

---

### Task 2: Build Cinder on ndskpc1

**Files:**
- Create: `tools/win/build-cinder.cmd`

**Interfaces:**
- Produces: `C:\Users\shawn\code\Cinder\lib\msw\x64\Release\cinder.lib` and `...\Debug\cinder.lib`, plus `cinderConfig.cmake` next to each, which `ci_make_app` consumes.

- [ ] **Step 1: Clone Cinder at the known-good commit**

```bash
ssh ndskpc1 'cd $HOME\code; git clone --recurse-submodules https://github.com/cinder/Cinder.git; cd Cinder; git checkout f90f332d1; git submodule update --init --recursive; git rev-parse --short HEAD'
```

Expected: last line `f90f332d1`.

- [ ] **Step 2: Write the Cinder build wrapper**

Cinder's CMake derives its library directory from `CMAKE_BUILD_TYPE`, so it needs a single-configuration generator. Ninja under `vcvars64` is that generator. Create `tools/win/build-cinder.cmd`:

```bat
@echo off
rem Build Cinder (static, x64) with Ninja under the VS 2022 Build Tools environment.
rem Usage: build-cinder.cmd [Release|Debug] [path\to\Cinder]
setlocal
set CONFIG=%1
if "%CONFIG%"=="" set CONFIG=Release
set CINDER=%2
if "%CINDER%"=="" set CINDER=%~dp0..\..\..\Cinder
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1
cmake -S "%CINDER%" -B "%CINDER%\build\%CONFIG%" -G Ninja -DCMAKE_BUILD_TYPE=%CONFIG% || exit /b 1
cmake --build "%CINDER%\build\%CONFIG%" || exit /b 1
dir "%CINDER%\lib\msw\x64\%CONFIG%\cinder.lib" || exit /b 1
endlocal
```

- [ ] **Step 3: Push the wrapper to the PC and build Release**

The gelbox checkout does not exist on the PC yet, so copy the one file for now. The Release build takes roughly 15 minutes on this CPU.

```bash
ssh ndskpc1 'New-Item -ItemType Directory -Force $HOME\code\gelbox-bootstrap | Out-Null'
scp tools/win/build-cinder.cmd ndskpc1:code/gelbox-bootstrap/
ssh ndskpc1 'cmd /c C:\Users\shawn\code\gelbox-bootstrap\build-cinder.cmd Release C:\Users\shawn\code\Cinder' 2>&1 | tail -5
```

Expected: the final `dir` line lists `cinder.lib` and the command exits 0. If the configure step fails on a missing dependency, read the first error: Cinder's Windows CMake build is maintained and `f90f332d1` builds on the Mac, so a failure here is almost always a missing SDK component, which `winget install ... --override "--add Microsoft.VisualStudio.Component.Windows11SDK.26100"` fixes.

- [ ] **Step 4: Build Debug**

```bash
ssh ndskpc1 'cmd /c C:\Users\shawn\code\gelbox-bootstrap\build-cinder.cmd Debug C:\Users\shawn\code\Cinder' 2>&1 | tail -3
```

Expected: `cinder.lib` under `lib\msw\x64\Debug`.

- [ ] **Step 5: Commit the wrapper**

```bash
git add tools/win/build-cinder.cmd
git commit -m "Add the Cinder build wrapper for Windows"
```

---

### Task 3: First Windows compile of Gelbox

**Files:**
- Modify: `proj/cmake/CMakeLists.txt`
- Create: `tools/win/build.cmd`

**Interfaces:**
- Produces: `C:\Users\shawn\code\gelbox\build-win\Gelbox.exe` with `build-win\assets\` beside it.

- [ ] **Step 1: Make the forced include compiler-aware**

In `proj/cmake/CMakeLists.txt`, replace

```cmake
target_compile_options( Gelbox PRIVATE "SHELL:-include ${APP_PATH}/include/Gelbox_Prefix.h" )
```

with

```cmake
if( MSVC )
	target_compile_options( Gelbox PRIVATE "/FI${APP_PATH}/include/Gelbox_Prefix.h" )
else()
	target_compile_options( Gelbox PRIVATE "SHELL:-include ${APP_PATH}/include/Gelbox_Prefix.h" )
endif()
```

- [ ] **Step 2: Copy assets beside the executable on Windows**

Cinder's `ci_make_app` makes a directory junction by default and copies when `CINDER_COPY_ASSETS` is on. Junctions survive on the same machine but not in an installer, and a copy is what the installer packages. `ci_make_app` reads the option when it runs, so add this directly above the `ci_make_app(` call:

```cmake
if( WIN32 )
	# A copied assets folder is what the installer ships; the junction that
	# ci_make_app makes by default does not survive packaging.
	set( CINDER_COPY_ASSETS ON CACHE BOOL "Copy assets beside the executable" FORCE )
endif()
```

- [ ] **Step 3: Rebuild on the Mac and confirm nothing changed there**

```bash
cmake -S proj/cmake -B build -DCMAKE_BUILD_TYPE=Release > /dev/null && cmake --build build -j 2>&1 | tail -1
ls -la build/Gelbox.app/Contents/Resources/assets
```

Expected: `Built target Gelbox` and the symlink still present.

- [ ] **Step 4: Write the Gelbox build wrapper**

Create `tools/win/build.cmd`:

```bat
@echo off
rem Configure and build Gelbox for Windows. Usage: build.cmd [Release|Debug]
setlocal
set CONFIG=%1
if "%CONFIG%"=="" set CONFIG=Release
set ROOT=%~dp0..\..
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1
cmake -S "%ROOT%\proj\cmake" -B "%ROOT%\build-win-%CONFIG%" -G Ninja -DCMAKE_BUILD_TYPE=%CONFIG% || exit /b 1
cmake --build "%ROOT%\build-win-%CONFIG%" || exit /b 1
dir "%ROOT%\build-win-%CONFIG%\Gelbox.exe" || exit /b 1
endlocal
```

- [ ] **Step 5: Clone gelbox on the PC and run the first build**

Push the branch first so the PC can pull it.

```bash
git add proj/cmake/CMakeLists.txt tools/win/build.cmd
git commit -m "Prepare the CMake project for MSVC

MSVC spells the forced include /FI, and ci_make_app's default directory junction for assets does not survive packaging, so the Windows configuration copies the folder instead. A build.cmd wrapper calls vcvars64 so the build runs from any shell."
git push
ssh ndskpc1 'cd $HOME\code; git clone https://github.com/douglaslab/gelbox.git; Remove-Item -Recurse -Force $HOME\code\gelbox-bootstrap'
ssh ndskpc1 'cmd /c C:\Users\shawn\code\gelbox\tools\win\build.cmd Release' 2>&1 | tee /tmp/claude-501/gelbox-win-build1.log | grep -E "error C|error LNK|Built|Gelbox.exe" | head -40
```

Expected on the first attempt: compiler errors. The known ones are listed in Step 6; anything else is new information to read in full from the log before changing code.

- [ ] **Step 6: Fix the portability errors, one commit each**

Likely errors and their fixes, in the order MSVC tends to report them:

1. `src/FileWatch.cpp` and `include/FileWatch.h` convert between `std::filesystem::path` and `ci::fs::path`. On MSVC these are the same type, so any explicit `.string()` round trip between them still compiles; if MSVC complains about an ambiguous constructor, pass the path object directly.
2. Non-standard functions: `strcasecmp` (use `ci::asciiCaseEqual`), `M_PI` (use `glm::pi<float>()`), `powf`/`roundf` without `<cmath>` (add the include).
3. Narrowing in braced initialisers, which MSVC rejects as errors where Clang only warns. Add the explicit cast.
4. `Interactions.h` includes `DropTarget.h`, which does not exist in the repository. The header is not included by any translation unit on the Mac; if MSVC reaches it through a different include order, delete the stale include line.

Rebuild after each fix with the same `ssh ... build.cmd Release` command until the output ends with the `dir` line listing `Gelbox.exe`.

- [ ] **Step 7: Confirm the assets copy landed**

```bash
ssh ndskpc1 'Get-ChildItem $HOME\code\gelbox\build-win-Release\assets | Measure-Object | Select-Object -ExpandProperty Count'
```

Expected: `17`, matching `ls assets | wc -l` on the Mac.

- [ ] **Step 8: Commit and push**

```bash
git push
```

---

### Task 4: Windows icon

**Files:**
- Create: `proj/cmake/Gelbox.ico`, `proj/cmake/Gelbox.rc`
- Modify: `proj/cmake/CMakeLists.txt`

- [ ] **Step 1: Build the .ico from the original icon set**

The Xcode asset catalogue with the PNG icon set was deleted in commit `7356a0a`; it is still in history. ImageMagick is on the Mac.

```bash
mkdir -p /tmp/claude-501/gelbox-icon && cd /tmp/claude-501/gelbox-icon
for f in 16 32 128 256 512; do git -C ~/code/gelbox show "7356a0a^:xcode/Gelbox/Images.xcassets/AppIcon.appiconset/$f.png" > "$f.png"; done
git -C ~/code/gelbox show "7356a0a^:xcode/Gelbox/Images.xcassets/AppIcon.appiconset/32@2x.png" > 64.png
magick 16.png 32.png 64.png 128.png 256.png -define icon:auto-resize=256,128,64,48,32,16 ~/code/gelbox/proj/cmake/Gelbox.ico
cd ~/code/gelbox && magick identify proj/cmake/Gelbox.ico
```

Expected: `identify` lists six frames from 256x256 down to 16x16.

- [ ] **Step 2: Add the resource script**

Create `proj/cmake/Gelbox.rc`:

```rc
// Application icon for the Windows build. The first ICON resource in the
// executable is what Explorer and the taskbar show.
IDI_GELBOX ICON "Gelbox.ico"
```

- [ ] **Step 3: Compile it into the executable on Windows only**

In `proj/cmake/CMakeLists.txt`, after the `file( GLOB GELBOX_SOURCES ... )` line, add:

```cmake
if( WIN32 )
	enable_language( RC )
	list( APPEND GELBOX_SOURCES "${CMAKE_CURRENT_SOURCE_DIR}/Gelbox.rc" )
endif()
```

- [ ] **Step 4: Verify on both machines**

```bash
cmake --build build -j 2>&1 | tail -1
git add proj/cmake/Gelbox.ico proj/cmake/Gelbox.rc proj/cmake/CMakeLists.txt
git commit -m "Give the Windows executable the Gelbox icon"
git push
ssh ndskpc1 'cd $HOME\code\gelbox; git pull -q; cmd /c tools\win\build.cmd Release' 2>&1 | tail -2
ssh ndskpc1 'Add-Type -AssemblyName System.Drawing; [System.Drawing.Icon]::ExtractAssociatedIcon("C:\Users\shawn\code\gelbox\build-win-Release\Gelbox.exe").Size'
```

Expected: the Mac still builds, and the last command prints `Width 32 Height 32` (the associated icon exists; a missing icon returns the generic executable glyph, also 32x32, so also open the folder in Explorer during Task 9 and confirm the gel icon).

---

### Task 5: Help button opens the browser through Cinder

**Files:**
- Modify: `src/GelboxApp.cpp:272-279`

- [ ] **Step 1: Replace the shell call**

Replace

```cpp
	mHelpBtn->mClickFunction = [this]()
	{
		string cmd = "open '";
		cmd += kConfig.mHelpURL;
		cmd += "'";

		::system(cmd.c_str());
	};
```

with

```cpp
	mHelpBtn->mClickFunction = [this]()
	{
		launchWebBrowser( Url( kConfig.mHelpURL ) );
	};
```

`launchWebBrowser` and `Url` come from `cinder/Utilities.h` and `cinder/Url.h`; add the includes at the top of `src/GelboxApp.cpp` if they are not already pulled in by `cinder/app/App.h`.

- [ ] **Step 2: Verify on the Mac**

```bash
cmake --build build -j 2>&1 | tail -1
open build/Gelbox.app
```

Click the help button. Expected: the default browser opens `http://douglaslab.org/gelbox/`.

- [ ] **Step 3: Commit**

```bash
git add src/GelboxApp.cpp
git commit -m "Open the help page with Cinder's browser launcher

The help button shelled out to the macOS open command, which does not exist on Windows."
```

---

### Task 6: Font fallback

**Files:**
- Create: `assets/fonts/SourceSans3-Medium.ttf`, `assets/fonts/SourceSans3-Bold.ttf`, `assets/fonts/LICENSE-SourceSans3.txt`
- Modify: `include/Layout.h`, `src/Layout.cpp`, `src/BufferView.cpp:33,56`

**Interfaces:**
- Produces: `ci::Font Layout::font( const std::string& name, float size ) const`, which every text render in the app calls instead of constructing `ci::Font` directly.

- [ ] **Step 1: Fetch the fallback typeface**

Source Sans 3 is OFL-licensed, has a Medium and a Bold that sit where Avenir Medium and Avenir Heavy sit, and ships static TTFs from a stable release URL.

```bash
cd /tmp/claude-501 && curl -fsSL -o source-sans.zip https://github.com/adobe-fonts/source-sans/releases/download/3.052R/TTF-source-sans-3.052R.zip
unzip -o -q source-sans.zip -d source-sans
mkdir -p ~/code/gelbox/assets/fonts
cp source-sans/TTF/SourceSans3-Medium.ttf source-sans/TTF/SourceSans3-Bold.ttf ~/code/gelbox/assets/fonts/
cp source-sans/LICENSE.md ~/code/gelbox/assets/fonts/LICENSE-SourceSans3.txt
ls -la ~/code/gelbox/assets/fonts
```

Expected: two TTFs of roughly 200 to 300 KB each and the licence file. If Shawn prefers a different face, swap the files and the two names in Step 2; nothing else depends on the choice.

- [ ] **Step 2: Add the helper to Layout**

In `include/Layout.h`, inside `class Layout` next to the `uiImage` declarations, add:

```cpp
	// Returns the named system font, or a bundled substitute when the system
	// does not have it. macOS has Avenir; Windows does not.
	ci::Font font( const std::string& name, float size ) const;
```

In `src/Layout.cpp`, add:

```cpp
ci::Font Layout::font( const std::string& name, float size ) const
{
	try
	{
		return Font( name, size );
	}
	catch ( const FontInvalidNameExc& )
	{
		// Avenir-Heavy and anything else bold goes to the Bold cut; everything else to Medium.
		const bool heavy = name.find("Heavy") != string::npos || name.find("Bold") != string::npos;
		const char* file = heavy ? "fonts/SourceSans3-Bold.ttf" : "fonts/SourceSans3-Medium.ttf";

		static map<string,DataSourceRef> cache;
		auto i = cache.find(file);
		if ( i == cache.end() ) i = cache.emplace( file, app::loadAsset(file) ).first;

		return Font( i->second, size );
	}
}
```

`loadAsset` throws `AssetLoadExc` when the bundled file is also missing, which is the right failure: the app cannot draw text at all.

- [ ] **Step 3: Route every Font construction through the helper**

In `src/Layout.cpp`, the three `renderText( str, Font(...), ... )` calls at lines 122, 127 and 132 become `renderText( str, font(mSubheadFont, mSubheadFontSize*pixelScale), ... )` and likewise for head and UI fonts. In `src/BufferView.cpp`, line 33 becomes `Font presetFont = kLayout.font( kLayout.mBufferViewPresetsFont, kLayout.mBufferViewPresetsFontSize * mTextContentScale );` and line 56 the same pattern for `labelFont`.

```bash
grep -n "Font(" src/*.cpp | grep -v "kLayout.font\|Layout::font\|return Font"
```

Expected: no output; every construction goes through the helper.

- [ ] **Step 4: Verify on the Mac, then force the fallback**

```bash
cmake --build build -j 2>&1 | tail -1 && open build/Gelbox.app
```

Expected: text looks exactly as before (Avenir is present). Then prove the fallback path works without a Windows machine: temporarily change `mHeadFont` in `include/Layout.h` to `"NoSuchFont-Heavy"`, rebuild, launch, and confirm the heading renders in Source Sans Bold rather than aborting. Restore the name by copying the file back from a copy you made before editing, not with `git checkout`:

```bash
cp include/Layout.h /tmp/claude-501/Layout.h.bak
# edit, build, look
cp /tmp/claude-501/Layout.h.bak include/Layout.h && git status --porcelain -- include/Layout.h
```

Expected: the status line is empty.

- [ ] **Step 5: Commit**

```bash
git add assets/fonts include/Layout.h src/Layout.cpp src/BufferView.cpp
git commit -m "Fall back to a bundled typeface when Avenir is missing

The UI names Avenir Medium and Avenir Heavy, which ship with macOS only, and Cinder throws on an unknown family. Layout::font tries the system name and falls back to Source Sans 3 from assets/fonts, so Windows renders text and the Mac is unchanged."
```

---

### Task 7: Accelerator key instead of Command

**Files:**
- Modify: `src/GelboxApp.cpp:660`, `src/GelView.cpp:426`, `README.md`

- [ ] **Step 1: Switch the two checks**

In `src/GelboxApp.cpp` `keyDown`, change `if ( event.isMetaDown() )` to `if ( event.isAccelDown() )`. In `src/GelView.cpp` `mouseDown`, change `if ( e.isMetaDown() )` to `if ( e.isAccelDown() )`. Leave `getModifierKeys` alone; it records the raw modifier state for the interaction code and is not a shortcut check.

```bash
grep -n "isMetaDown" src/*.cpp
```

Expected: only the line inside `GelboxApp::getModifierKeys` remains.

- [ ] **Step 2: Check the hover loupe path**

```bash
grep -n "META_DOWN\|mModifierKeys" src/GelView.cpp src/GelboxApp.cpp | head
```

If the loupe-on-hover code tests `mModifierKeys & META_DOWN`, add the accelerator flag to `getModifierKeys` (`if (e.isAccelDown()) m |= app::KeyEvent::ACCEL_DOWN;`) and test `mModifierKeys & ACCEL_DOWN` in the hover code. Do not widen the test to include `CTRL_DOWN`; on the Mac, Control-click carries its own meaning.

- [ ] **Step 3: Verify on the Mac**

Build, launch, and confirm Cmd-S opens the save dialog, Cmd-O the open dialog, and holding Cmd while hovering shows the loupe. Expected: identical behaviour to before.

- [ ] **Step 4: Update the README shortcut table**

Add one sentence above the Commands table: "On Windows, read Ctrl for the command key and Alt for option."

- [ ] **Step 5: Commit**

```bash
git add src/GelboxApp.cpp src/GelView.cpp README.md
git commit -m "Use the platform accelerator key for shortcuts and loupes

Cinder maps the accelerator to Command on macOS and Control on Windows; the code tested the Meta flag directly, which is the Windows key on a PC."
```

---

### Task 8: Fractional display scales

**Files:**
- Modify: `src/Layout.cpp:32`, `include/Layout.h`

- [ ] **Step 1: Centralise the asset scale decision**

Add to `include/Layout.h`:

```cpp
	// 2 when the window is denser than 1:1 (Retina, or a Windows scale above 100%), else 1.
	int assetScale() const { return ci::app::getWindowContentScale() > 1.f ? 2 : 1; }
```

In `src/Layout.cpp` `uiImageWithPath`, replace `scaleFactor = (ci::app::getWindowContentScale()==2) ? 2 : 1;` with `scaleFactor = assetScale();`.

- [ ] **Step 2: Audit the other content-scale uses**

```bash
grep -n "getWindowContentScale" src/*.cpp
```

Each remaining use multiplies a size by the scale, which is correct for fractional values. Any use that compares to `2` gets the same replacement as Step 1.

- [ ] **Step 3: Verify on the Mac and commit**

Build and launch; the Retina path still picks @2x. Then:

```bash
git add include/Layout.h src/Layout.cpp
git commit -m "Pick @2x assets for any scale above 1

Windows reports fractional content scales such as 1.5; the old test for exactly 2 sent those displays the 1x images."
```

The 150% verification on Windows happens in Task 10 once the app runs there.

---

### Task 9: First run on Windows

**Files:**
- Modify: `src/GelboxApp.cpp` (`prepareSettings`)
- Create: `tools/win/run.ps1`, `tools/win/screenshot.ps1`, `tools/win/stop.ps1`

**Interfaces:**
- Produces: a remote run loop. `run.ps1` launches `Gelbox.exe` in the console session with its output in `build-win-Release\gelbox.log`; `screenshot.ps1` writes a PNG; `stop.ps1` ends the process.

- [ ] **Step 1: Log to a file when asked**

A `WIN32` executable has no console. In `GelboxApp::prepareSettings` (around `src/GelboxApp.cpp:760`), before the existing settings calls, add:

```cpp
	// A GUI process on Windows has no console; route cout/cerr to a file when asked.
	if ( const char* logPath = getenv("GELBOX_LOG") )
	{
		freopen( logPath, "w", stdout );
		freopen( logPath, "a", stderr );
		setvbuf( stdout, nullptr, _IONBF, 0 );
		setvbuf( stderr, nullptr, _IONBF, 0 );
	}
```

This is cross-platform and also removes the block-buffering problem seen on the Mac when stdout is redirected.

- [ ] **Step 2: Write the launch script**

Create `tools/win/run.ps1`:

```powershell
# Launch Gelbox.exe in the interactive console session from an SSH session.
# A GUI app started directly over SSH lands in session 0 and never shows on screen,
# so this registers a one-shot interactive scheduled task and runs it.
param([string]$Config = "Release", [string]$Open = "")
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$exe  = Join-Path $root "build-win-$Config\Gelbox.exe"
$log  = Join-Path $root "build-win-$Config\gelbox.log"
if (-not (quser 2>$null | Select-String "console")) { Write-Error "Nobody is logged on at the console; log in at the PC first."; exit 2 }
$cmd = "cmd /c set GELBOX_LOG=$log&& `"$exe`" $Open"
schtasks /Delete /F /TN GelboxRun 2>$null | Out-Null
schtasks /Create /F /TN GelboxRun /SC ONCE /ST 00:00 /IT /RL LIMITED /TR $cmd | Out-Null
schtasks /Run /TN GelboxRun | Out-Null
Start-Sleep -Seconds 4
if (Get-Process Gelbox -ErrorAction SilentlyContinue) { "running"; Get-Content $log -ErrorAction SilentlyContinue | Select-Object -First 20 } else { "not running"; Get-Content $log -ErrorAction SilentlyContinue; exit 1 }
```

Create `tools/win/screenshot.ps1`:

```powershell
# Capture the primary screen of the console session to a PNG. Runs through the
# same interactive scheduled-task trick as run.ps1 so it sees the real desktop.
param([string]$Out = "$HOME\gelbox-shot.png")
$inner = @"
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
`$b=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds
`$bmp=New-Object System.Drawing.Bitmap `$b.Width,`$b.Height
`$g=[System.Drawing.Graphics]::FromImage(`$bmp); `$g.CopyFromScreen(`$b.Location,[System.Drawing.Point]::Empty,`$b.Size)
`$bmp.Save('$Out',[System.Drawing.Imaging.ImageFormat]::Png)
"@
$tmp = Join-Path $env:TEMP "gelbox-shot.ps1"; Set-Content $tmp $inner
schtasks /Delete /F /TN GelboxShot 2>$null | Out-Null
schtasks /Create /F /TN GelboxShot /SC ONCE /ST 00:00 /IT /RL LIMITED /TR "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File $tmp" | Out-Null
schtasks /Run /TN GelboxShot | Out-Null
Start-Sleep -Seconds 3
if (Test-Path $Out) { (Get-Item $Out).Length } else { Write-Error "no screenshot written; is the console session unlocked?"; exit 1 }
```

Create `tools/win/stop.ps1`:

```powershell
Stop-Process -Name Gelbox -Force -ErrorAction SilentlyContinue
schtasks /Delete /F /TN GelboxRun 2>$null | Out-Null
"stopped"
```

- [ ] **Step 3: Shawn logs on at the PC**

Needs a person at `ndskpc1`: sign in at the console and leave the session unlocked. While the remote loop is in use, set Settings > System > Power > Screen timeout to Never and Settings > Accounts > Sign-in options > "If you've been away, when should Windows require you to sign in again?" to Never. These are reverted when the port is done.

- [ ] **Step 4: Build, run, look**

```bash
git add src/GelboxApp.cpp tools/win/run.ps1 tools/win/screenshot.ps1 tools/win/stop.ps1
git commit -m "Add a remote run loop for the Windows build

GELBOX_LOG routes cout and cerr to a file, and three scripts launch the app in the console session from SSH, capture the screen, and stop it."
git push
ssh ndskpc1 'cd $HOME\code\gelbox; git pull -q; cmd /c tools\win\build.cmd Release' 2>&1 | tail -1
ssh ndskpc1 'powershell -ExecutionPolicy Bypass -File $HOME\code\gelbox\tools\win\run.ps1'
ssh ndskpc1 'powershell -ExecutionPolicy Bypass -File $HOME\code\gelbox\tools\win\screenshot.ps1'
scp ndskpc1:gelbox-shot.png /tmp/claude-501/gelbox-win-first.png
```

Read the PNG. Expected: the Gelbox window with the empty gel, the microtube rack, sliders and settings button; `gelbox.log` lists the eleven `FileWatch::doLoad` lines with `build-win-Release\assets\...` paths and no `ERROR` lines other than the known `microtube1500ul@2x.png` one.

Likely first-run failures and where to look:

- A blank or black window with `gl` errors in the log: the Intel driver rejected the 3.3 core context or a shader. Try `RendererGl::Options().version(3,2)` in the `CINDER_MSW` branch at the bottom of `GelboxApp.cpp`; if shaders fail, their compile log is in `gelbox.log` through Cinder's `GlslProgCompileExc`.
- `Failed to find any asset directories`: the copy in Task 3 Step 7 did not happen for this configuration; rerun `build.cmd` after deleting `build-win-Release\CMakeCache.txt`.
- Window appears for a frame and exits with no log: `GELBOX_LOG` was not applied because `prepareSettings` runs after static initialisers that already printed; move the block to the top of `main`'s equivalent by placing it in a static initialiser in `GelboxApp.cpp`.

- [ ] **Step 5: Stop the app**

```bash
ssh ndskpc1 'powershell -ExecutionPolicy Bypass -File $HOME\code\gelbox\tools\win\stop.ps1'
```

---

### Task 10: Functional pass on Windows

This task is a checklist executed with Shawn at the PC (fastest) or through the run loop plus screenshots. Each line is a behaviour to confirm; a failure becomes its own fix commit following the Task 3 pattern.

- [ ] **Step 1: Keyboard and mouse**

Ctrl-S opens a save dialog; Ctrl-Alt-S with a tube selected saves a sample; Ctrl-O opens the open dialog; Ctrl-R toggles gel rendering; Ctrl-L toggles loupe-on-hover; holding Ctrl while hovering shows a loupe; Ctrl-click places a fixed loupe; Alt-drag on a band clones it; Alt-drag on a tube clones the sample; Tab cycles bands; Delete removes a selected band.

- [ ] **Step 2: Save and load round trip, including awkward paths**

Create a gel with three samples, save it to `C:\Users\shawn\Documents\Gelbox test ü\round-trip.json` (make the folder first), quit, reopen the app, open the file with Ctrl-O and again by dragging it from Explorer onto the window. Expected: identical lanes. Then load `assets\palette\1kbladder.xml` by dragging it onto a lane.

- [ ] **Step 3: Drag and drop of an image**

Drag a PNG from Explorer onto the window. Expected: the image view appears as on the Mac.

- [ ] **Step 4: Sliders and settings**

Voltage from -300 to 300, time from 0 to 180 minutes, well damage, buffer presets, the settings gear, and the help button (opens the browser; Task 5).

- [ ] **Step 5: Hot reload**

Edit `build-win-Release\assets\tuning\gel-render.json` (the copy, not the repository file) and confirm the change applies without restart. Record in `tools/win/README.md` that on Windows the live-edited files are the copies beside the executable.

- [ ] **Step 6: 150% display scale**

Set Settings > System > Display > Scale to 150%, sign out and in, launch again. Expected: the UI is the same physical size as at 100% and the icons are the @2x images (sharp, not upscaled). Restore 100% afterwards.

- [ ] **Step 7: Relocated copy**

Copy `build-win-Release\` to `C:\Users\shawn\Desktop\GelboxCopy\` and run `Gelbox.exe` from there by double-click. Expected: runs; this is the installer layout.

- [ ] **Step 8: Commit any fixes and push**

---

### Task 11: Rendering parity

**Files:**
- Create: `tools/compare-renders.py`

**Interfaces:**
- Produces: a numeric comparison of a Mac capture and a Windows capture of the same gel file at the same window size, printing per-lane band centroid rows and the mean absolute pixel difference inside the gel rectangle.

- [ ] **Step 1: Make a reference gel**

On the Mac, load `assets/palette/1kbladder.xml` into lanes 1 and 4, add two custom samples, set time to 60 minutes and voltage to 70, save as `research/parity/parity.json`, and commit it. This file is the fixture for both machines.

- [ ] **Step 2: Capture both**

Mac: launch `build/Gelbox.app`, open the fixture, then `screencapture -l $(osascript -e 'tell app "Gelbox" to id of window 1') /tmp/claude-501/parity-mac.png`. Windows: `run.ps1 -Open C:\Users\shawn\code\gelbox\research\parity\parity.json`, then `screenshot.ps1`, then `scp`. Crop both to the window with Pillow if the Windows capture is the full screen.

- [ ] **Step 3: Write the comparison**

Create `tools/compare-renders.py`:

```python
#!/usr/bin/env python3
"""Compare two Gelbox window captures numerically.

usage: compare-renders.py mac.png win.png [--gel x,y,w,h]

Prints the mean absolute difference inside the gel rectangle and, for each of
up to 8 lanes, the brightness-weighted row centroid of the lane, which is where
the bands sit. Centroids that differ by more than 3 px or a mean difference above
6/255 mean the two renders disagree beyond font and antialiasing noise.
"""
import sys
from PIL import Image, ImageChops
import numpy as np

def load(p):
    return np.asarray(Image.open(p).convert("L"), dtype=np.float32)

def lane_centroids(gel, lanes=8):
    h, w = gel.shape
    out = []
    for i in range(lanes):
        x0, x1 = int(i * w / lanes), int((i + 1) * w / lanes)
        col = gel[:, x0:x1].sum(axis=1)
        out.append(float((col * np.arange(h)).sum() / max(col.sum(), 1e-6)))
    return out

def main():
    a, b = load(sys.argv[1]), load(sys.argv[2])
    if a.shape != b.shape:
        sys.exit(f"size mismatch {a.shape} vs {b.shape}; crop to the same window first")
    if "--gel" in sys.argv:
        x, y, w, h = map(int, sys.argv[sys.argv.index("--gel") + 1].split(","))
        a, b = a[y:y+h, x:x+w], b[y:y+h, x:x+w]
    print(f"mean abs diff: {np.abs(a - b).mean():.2f} / 255")
    for i, (ca, cb) in enumerate(zip(lane_centroids(a), lane_centroids(b))):
        flag = "" if abs(ca - cb) <= 3 else "  <-- differs"
        print(f"lane {i+1}: mac {ca:7.1f}  win {cb:7.1f}{flag}")

if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run it**

```bash
python3 -I tools/compare-renders.py /tmp/claude-501/parity-mac.png /tmp/claude-501/parity-win.png --gel 120,80,900,600
```

The `--gel` rectangle is the gel area in window pixels, read off the Mac capture with Preview's selection readout; the numbers above are an example and the same rectangle must be used for both captures.

Expected: no lane flagged and a mean difference under 6. Fonts differ by design (Avenir versus Source Sans), which is why the gel rectangle, not the whole window, is compared.

- [ ] **Step 5: If the Intel GL path disagrees, switch to ANGLE**

Cinder ships the ANGLE libraries in `lib/msw/x64`. Rebuild Cinder with `-DCINDER_GL_ANGLE=ON` added to the cmake line in `build-cinder.cmd` (make it a third optional argument), configure Gelbox with the same define, and `ci_make_app` copies the three DLLs beside the executable. The `CINDER_MSW` branch at the bottom of `GelboxApp.cpp` already drops the 3.3 version request when `CINDER_GL_ANGLE` is defined. Re-run Step 4. Whichever path passes becomes the default in `build.cmd`, recorded in `tools/win/README.md` with the measured numbers.

- [ ] **Step 6: Commit**

```bash
git add tools/compare-renders.py research/parity/parity.json tools/win/README.md
git commit -m "Add the render parity fixture and comparison"
```

---

### Task 12: Installer

**Files:**
- Create: `proj/win/Gelbox.iss`, `tools/win/package.cmd`

**Interfaces:**
- Produces: `dist\Gelbox-Setup-1.0.exe` that installs to `C:\Program Files\Gelbox`, adds a Start menu entry, and uninstalls cleanly.

- [ ] **Step 1: Install Inno Setup on the PC**

```bash
ssh ndskpc1 'winget install --id JRSoftware.InnoSetup --exact --silent --accept-package-agreements --accept-source-agreements; Write-Output "winget exit $LASTEXITCODE"'
ssh ndskpc1 'Test-Path "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"'
```

Expected: `winget exit 0` then `True`.

- [ ] **Step 2: Write the script**

Create `proj/win/Gelbox.iss`:

```ini
; Inno Setup script for Gelbox. Built by tools\win\package.cmd, which passes the
; version and the build directory on the command line.
#ifndef AppVersion
  #define AppVersion "1.0"
#endif
#ifndef BuildDir
  #define BuildDir "..\..\build-win-Release"
#endif

[Setup]
AppId={{B5D5E1A4-6C2E-4C2B-9A2B-5F0B3B4E1D01}
AppName=Gelbox
AppVersion={#AppVersion}
AppPublisher=Douglas Lab, UCSF
AppPublisherURL=http://douglaslab.org/gelbox/
DefaultDirName={autopf}\Gelbox
DefaultGroupName=Gelbox
UninstallDisplayIcon={app}\Gelbox.exe
OutputDir=..\..\dist
OutputBaseFilename=Gelbox-Setup-{#AppVersion}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\cmake\Gelbox.ico
PrivilegesRequiredOverridesAllowed=dialog

[Files]
Source: "{#BuildDir}\Gelbox.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#BuildDir}\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#BuildDir}\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Gelbox"; Filename: "{app}\Gelbox.exe"
Name: "{autodesktop}\Gelbox"; Filename: "{app}\Gelbox.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; Flags: unchecked

[Run]
Filename: "{app}\Gelbox.exe"; Description: "Launch Gelbox"; Flags: nowait postinstall skipifsilent
```

Gel files are plain `.json`, so the installer registers no file association; associating `.json` would hijack every JSON file on the machine.

- [ ] **Step 3: Write the packaging wrapper**

Create `tools/win/package.cmd`:

```bat
@echo off
rem Build a Release Gelbox and wrap it in the Inno Setup installer. Usage: package.cmd [version]
setlocal
set VERSION=%1
if "%VERSION%"=="" set VERSION=1.0
set ROOT=%~dp0..\..
call "%~dp0build.cmd" Release || exit /b 1
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" /DAppVersion=%VERSION% /DBuildDir="%ROOT%\build-win-Release" "%ROOT%\proj\win\Gelbox.iss" || exit /b 1
dir "%ROOT%\dist\Gelbox-Setup-%VERSION%.exe" || exit /b 1
endlocal
```

- [ ] **Step 4: Build and test the installer on the PC**

```bash
git add proj/win/Gelbox.iss tools/win/package.cmd
git commit -m "Add the Windows installer

Inno Setup packages Gelbox.exe and the assets folder into a per-machine or per-user install with a Start menu entry."
git push
ssh ndskpc1 'cd $HOME\code\gelbox; git pull -q; cmd /c tools\win\package.cmd 1.0' 2>&1 | tail -2
ssh ndskpc1 'Start-Process $HOME\code\gelbox\dist\Gelbox-Setup-1.0.exe -ArgumentList "/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /LOG=$HOME\gelbox-install.log" -Wait; Test-Path "C:\Program Files\Gelbox\Gelbox.exe"; (Get-ChildItem "C:\Program Files\Gelbox\assets").Count'
```

Expected: `True` and `17`. Then launch from the Start menu (person at the PC, or `run.ps1` pointed at the installed exe) and confirm it opens. Uninstall through Settings > Apps and confirm `C:\Program Files\Gelbox` is gone.

- [ ] **Step 5: Ignore the installer output and commit**

```bash
printf 'dist/\n' >> .gitignore
git add .gitignore
git commit -m "Ignore installer output"
git push
```

---

### Task 13: Code signing

**Files:**
- Modify: `proj/win/Gelbox.iss`, `tools/win/package.cmd`, `tools/win/README.md`

An unsigned installer trips SmartScreen with "Windows protected your PC" and a buried "Run anyway". Signing needs a certificate, which is a purchase and an identity-verification step that only Shawn can do. The code changes are small and wait on that.

- [ ] **Step 1: Decide the certificate route (Shawn)**

Two realistic options. Azure Trusted Signing is a subscription of about ten dollars a month, verifies the organisation (UCSF or Douglas Lab) once, and signs through `signtool` with a dlib plug-in, with no hardware token; it is the cheaper and lower-friction route and the recommendation. An OV certificate from a CA such as SSL.com or Certum costs a few hundred dollars a year, arrives on a hardware token or in a cloud HSM, and also works through `signtool`. Either way SmartScreen reputation accrues over the first few hundred installs.

- [ ] **Step 2: Wire signing into Inno Setup**

When the certificate exists, add to `[Setup]`:

```ini
SignTool=gelboxsign
SignedUninstaller=yes
```

and define `gelboxsign` for ISCC on the command line in `package.cmd` so no secret lives in the repository:

```bat
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "/Sgelboxsign=%SIGNTOOL_CMD% $f" ...
```

where `SIGNTOOL_CMD` is set in the environment on the PC to the full `signtool sign ...` command for the chosen route. Also sign `Gelbox.exe` itself before packaging with the same command, so the executable inside is trusted too.

- [ ] **Step 3: Verify**

```bash
ssh ndskpc1 'cmd /c "call ""C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"" >nul && signtool verify /pa /v C:\Users\shawn\code\gelbox\dist\Gelbox-Setup-1.0.exe"'
```

Expected: `Successfully verified`. Download the installer through a browser on the PC and run it; SmartScreen should show the publisher name rather than "Unknown publisher".

- [ ] **Step 4: Record the route and commit**

Add a "Signing" paragraph to `tools/win/README.md` naming the certificate route, where `SIGNTOOL_CMD` is set on the PC, and the `signtool verify` command above.

```bash
git add proj/win/Gelbox.iss tools/win/package.cmd tools/win/README.md
git commit -m "Sign the Windows executable and installer"
git push
```

---

### Task 14: GitHub Actions compile guard

**Files:**
- Create: `.github/workflows/windows.yml`

**Interfaces:**
- Produces: a workflow that builds Cinder once per Cinder commit (cached) and Gelbox on every push, uploading `Gelbox.exe` plus `assets` as an artifact.

- [ ] **Step 1: Write the workflow**

```yaml
name: windows
on:
  push:
    branches: [master]
  pull_request:
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-2022
    env:
      CINDER_COMMIT: f90f332d1
    steps:
      - uses: actions/checkout@v4
        with:
          path: gelbox

      - name: Cache Cinder
        id: cinder-cache
        uses: actions/cache@v4
        with:
          path: Cinder
          key: cinder-msw-x64-${{ env.CINDER_COMMIT }}-v1

      - name: Clone Cinder
        if: steps.cinder-cache.outputs.cache-hit != 'true'
        shell: pwsh
        run: |
          git clone --recurse-submodules https://github.com/cinder/Cinder.git
          git -C Cinder checkout $env:CINDER_COMMIT
          git -C Cinder submodule update --init --recursive

      - name: Build Cinder
        if: steps.cinder-cache.outputs.cache-hit != 'true'
        shell: cmd
        run: |
          call "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat"
          cmake -S Cinder -B Cinder\build\Release -G Ninja -DCMAKE_BUILD_TYPE=Release
          cmake --build Cinder\build\Release

      - name: Build Gelbox
        shell: cmd
        run: |
          call "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat"
          cmake -S gelbox\proj\cmake -B gelbox\build-win-Release -G Ninja -DCMAKE_BUILD_TYPE=Release -DCINDER_PATH=%CD%\Cinder
          cmake --build gelbox\build-win-Release

      - uses: actions/upload-artifact@v4
        with:
          name: Gelbox-windows-x64
          path: |
            gelbox/build-win-Release/Gelbox.exe
            gelbox/build-win-Release/assets
```

The `vcvars64.bat` path on the hosted `windows-2022` image is the Enterprise edition; `build.cmd` keeps the Build Tools path for the lab PC, which is why the workflow spells the cmake lines out rather than calling it. Cinder's build is around 20 minutes on a hosted runner and only runs when the cache key misses.

- [ ] **Step 2: Push and watch**

```bash
git add .github/workflows/windows.yml
git commit -m "Build the Windows executable on GitHub Actions"
git push
gh run watch --exit-status
```

Expected: green, with an artifact of about 10 MB.

---

### Task 15: Documentation

**Files:**
- Modify: `README.md`, `tools/win/README.md`

- [ ] **Step 1: README Windows section**

Add a "Windows" subsection under "To build" that points to `tools/win/README.md`, lists the two winget installs, the `build-cinder.cmd` and `build.cmd` wrappers, and the installer from `package.cmd`, and names the download location once releases exist.

- [ ] **Step 2: Revert the convenience settings on ndskpc1**

Restore screen timeout and sign-in-after-away to their previous values on the PC. Remove the `GelboxRun` and `GelboxShot` scheduled tasks with `stop.ps1` and `schtasks /Delete /F /TN GelboxShot`.

- [ ] **Step 3: Commit and push**

```bash
git add README.md tools/win/README.md
git commit -m "Document the Windows build and installer"
git push
```

---

## Open decisions for Shawn

- **Fallback typeface.** The plan uses Source Sans 3 Medium and Bold because they are OFL-licensed with a stable download. Any other face with a Medium and a Bold cut drops in by replacing two files and two strings.
- **Certificate route.** Azure Trusted Signing is recommended in Task 13; the alternative is an OV certificate on a token. Nothing before Task 13 depends on this.
- **Where releases live.** GitHub Releases on `douglaslab/gelbox` is the simplest; the README in Task 15 needs the answer.
- **Who sits at the PC for Tasks 9 to 11.** The screenshot loop works but is slow for interaction tests; an hour at the keyboard covers Task 10 in one pass.
