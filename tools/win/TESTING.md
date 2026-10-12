# Windows port verification

Last tested: 2026-10-11 on ndskpc1, Windows 11, Intel Arc 140T.
Plan: [2026-10-10 Windows port](../../docs/superpowers/plans/2026-10-10-windows-port.md).

Tasks1–15 are complete, with Task13 changed to unsigned distribution at
Shawn’s request. The fresh whole-change review found no release blockers.

## Verified

| Check | Evidence |
| --- | --- |
| Windows Release and Debug | Both build and launch; eleven FileWatch startup loads, no shader errors. |
| Mac regression | `cmake --build build -j` and native launch pass; eleven loads and only the known missing `microtube1500ul@2x.png` error. |
| Keyboard and mouse | Shawn confirmed Ctrl-S, Ctrl-Alt-S, Ctrl-O, Ctrl-R, Ctrl-L, Ctrl-hover/click loupes, both Alt-drag operations, Tab and Delete. |
| Save scope | `Documents\Gelbox\test.json` contains a gel; `tube.json` contains a sample. Shawn confirmed distinct Save Gel / Save Sample titles. |
| Default extension and overwrite | Entering an extensionless name produces `.json`; repeating the name asks to replace the existing file. |
| Save/load round trip | Shawn reopened his three populated lanes after restarting, through Ctrl-O and Explorer drag/drop. |
| Unicode and spaces | Remote native dialogs saved and opened a path containing spaces and `ü`; resaving reproduced the original JSON byte-for-byte. Native drop of the Unicode path also round-tripped identically. |
| XML ladder drop | A native Windows file-drop message inserted `1kbladder.xml` into an empty lane; saved populated-sample count increased from three to four. |
| PNG drop | Native file-drop message displayed the microtube PNG as a selected image view. |
| Sliders | Saved model values confirm voltage -300/+300, time 0/180 minutes, and well damage 0/1. |
| Buffer presets | TBE, TAE and water concentrations confirmed in saved JSON. |
| Settings after loading | Old panel closes; reopened panel shows the loaded gel, and selecting TAE saves its expected concentrations in that gel. |
| Settings and Help | App and gel settings panels render; clicking Help opens the Douglas Lab Gelbox page in Chrome. |
| Hot reload | Changing copied `H2ODistort.Faint` from .25 to 1 changed the gel crop's mean brightness from 2.9691 to 10.1807. Restoring the original bytes restored the exact pixels, without restarting. |
| Relocation | A copy containing only the executable and assets launches from a directory with spaces and `ü`; all eleven loads resolve to that copy's assets. |
| Display scale | At 150%, native DPI144, full Sample/Species layout fits, icons/text remain sharp, and scaled band selection works. Shawn signed out/in for the check and restored100%; native DPI96 verified after relaunch. |
| Antialiasing | Windows originally reported zero samples and jagged circles. With explicit 4x MSAA it reports four samples and screenshot edges are smoother; Mac also reports four. |

Remote tests ran through an interactive scheduled task in the signed-in console
session. Mouse and keyboard actions used native Windows input. XML/PNG and the
Unicode drop used `WM_DROPFILES`, exercising Cinder's native drop handler; the
ordinary JSON Explorer drag was tested by Shawn. Test copies stayed inside the
Gelbox checkout rather than writing another Desktop or Documents directory.
Shawn changed display scale for the test and restored it to100%. No power or
sign-in settings were changed by the test scripts.

## Fixes found during Task 10

- Give Windows JSON saves a default extension before native overwrite checking.
- Label Windows save dialogs **Save Sample** and **Save Gel**.
- Request 4x MSAA on native Windows, matching the Mac, and log actual samples.
- Close the old gel settings panel when loading a new gel: its buffer controls
  held a reference to the previous model and could otherwise edit that old gel.

## Release validation

- Task 11: native Mac/Windows parity passes: mean grayscale difference0.0861/255,
  maximum lane-centroid difference0.1568px. Startup file loading verified.
- Task 12: Inno Setup6.7.3 installer installs, launches and uninstalls successfully.
  All99 installed asset files match their source SHA-256 hashes; Start menu
  shortcut created and removed; installation directory removed after uninstall.
- Task 13: user chose unsigned Windows distribution; no signing purchase pending.
- Task 14: [hosted Windows build](https://github.com/douglaslab/gelbox/actions/runs/38207870780)
  passes and uploads executable plus assets.
- Mac 1.1: embedded-assets Release build is arm64; ad-hoc signature and disk-image
  checksum verify. Launch directly from mounted read-only DMG passes eleven loads
  and four MSAA samples, with only the known missing high-resolution tube icon.

The Windows test processes are stopped and the GelboxRun, GelboxShot,
GelboxTest and GelboxInstall scheduled tasks are removed. No agent changes
were made to power, sign-in or security settings; Shawn restored display scale
to100%, verified earlier at nativeDPI96.

## Remaining release work

Upload and public download verification. Final review and decision record:
[execution report](../../docs/superpowers/reports/2026-10-11-windows-port.md).
Reference-based buffer and sample-load modeling is a separate follow-up:
[research notes](../../docs/research/2026-10-11-gel-model-reference.md).
