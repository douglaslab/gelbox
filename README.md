# Gelbox

## About

Created by Chaim Gingold in collaboration with Shawn Douglas for the Douglas Lab, UCSF.

http://www.douglaslab.org/gelbox/


## To build

Gelbox is a [Cinder](https://libcinder.org) app and builds with CMake on macOS. It needs Xcode (for the command-line tools and SDK), CMake 3.16 or newer (`brew install cmake`), and a Cinder checkout next to this repository. Cinder's `master` branch is required; the last tagged release, v0.9.3, does not compile against current macOS SDKs. Cinder commit `f90f332d1` is known to work.

1. Clone and build Cinder as a sibling of the Gelbox directory:

   ```
   cd ..
   git clone https://github.com/cinder/Cinder.git
   cd Cinder
   cmake -S . -B build/Release -DCMAKE_BUILD_TYPE=Release
   cmake --build build/Release -j
   ```

   For a debug build of Gelbox, also build Cinder's Debug configuration (`build/Debug` with `-DCMAKE_BUILD_TYPE=Debug`).

2. Configure and build Gelbox:

   ```
   cd ../gelbox
   cmake -S proj/cmake -B build -DCMAKE_BUILD_TYPE=Release
   cmake --build build -j
   open build/Gelbox.app
   ```

If Cinder lives somewhere else, pass `-DCINDER_PATH=/path/to/Cinder` to the first `cmake` command, or set `CINDER_PATH` in the environment.

The build links `assets/` into `Gelbox.app/Contents/Resources` (and beside the app), so the bundle can be copied elsewhere on this machine and edits to tuning files and shaders in the repository are picked up live by the running app. To embed a real copy of the assets for a bundle that will leave this machine, configure with `-DCINDER_COPY_ASSETS=ON`.

To work in Xcode, generate a project instead of makefiles: `cmake -S proj/cmake -B build-xcode -G Xcode`, then open `build-xcode/Gelbox.xcodeproj`.

## Commands and Shortcuts

|             Command          |             Meaning            |
| :- | :- |
| *Loupes* ||
| Show loupe			| Hold command key while hovering over gel, or toggle app setting. |
| Add fixed loupe		| Hold command key and click in gel. Reposition by dragging. To close, click on loupe then push escape or delete. |
| *Bands* ||
| Move band				| Click and drag band. Hold Shift to lock size. |
| Duplicate band			| Opt-drag band. |
| Delete band				| Select band with mouse and push delete key. |
| Select next species/band in sample | Tab key; shift-tab to reverse. |
| *Samples* ||
| Clone sample			| Opt-drag sample tube. |
| Move sample			| Drag sample tube to a new well. |
| Delete sample			| Drag sample away from gel, and release. |
| *Save and Load* ||
| Save gel				| Cmd-S. Or use app menu. |
| Open gel 				| Cmd-O, or drag file into window. Or use app menu. |
| Save selected sample		| Cmd-Opt-S. Or use app menu. |
| Load sample			| Drag sample file into window; can drop it into a specific lane. |
| Load image				| Drag image file into window. |

## Distribution builds

For a self-contained Apple Silicon build with the 2026-10-10 fixes:

```sh
cmake -S proj/cmake -B build-distribution -DCMAKE_BUILD_TYPE=Release -DCINDER_COPY_ASSETS=ON -DGELBOX_VERSION=1.0.1 -DGELBOX_BUILD_NUMBER=20261010
cmake --build build-distribution -j 8
```

Version 1.0.1 starts DNA bands flat and ramps curvature over the first ten
simulated minutes; negative voltage reverses the curvature. The macOS build
uses current Cinder and embeds its assets for distribution. The arm64 build
is not an Intel binary. Public Developer ID signing and notarization are
separate release steps; the locally prepared 2026-10-10 package is ad-hoc
signed and not notarized.
