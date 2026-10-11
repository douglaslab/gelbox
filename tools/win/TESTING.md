# Windows port verification

Last tested: 2026-10-11 on ndskpc1, Windows 11, Intel Arc 140T.
Plan: [2026-10-10 Windows port](../../docs/superpowers/plans/2026-10-10-windows-port.md).

Tasks 1–9 are complete. Task 10 remains open for the 150% display-scale check.
Later tasks have not been started, preserving the requested task order.

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
| Antialiasing | Windows originally reported zero samples and jagged circles. With explicit 4x MSAA it reports four samples and screenshot edges are smoother; Mac also reports four. |

Remote tests ran through an interactive scheduled task in the signed-in console
session. Mouse and keyboard actions used native Windows input. XML/PNG and the
Unicode drop used `WM_DROPFILES`, exercising Cinder's native drop handler; the
ordinary JSON Explorer drag was tested by Shawn. Test copies stayed inside the
Gelbox checkout rather than writing another Desktop or Documents directory.
Actual window DPI was 96 (100%). No display, sign-in or power settings were changed.

## Fixes found during Task 10

- Give Windows JSON saves a default extension before native overwrite checking.
- Label Windows save dialogs **Save Sample** and **Save Gel**.
- Request 4x MSAA on native Windows, matching the Mac, and log actual samples.
- Close the old gel settings panel when loading a new gel: its buffer controls
  held a reference to the previous model and could otherwise edit that old gel.

## Still to do, in plan order

1. **Task 10: 150% scale with a person at the console.** Set Windows display scale
   to 150%, sign out/in, launch Release, check layout and sharp high-resolution
   icons/text, then restore 100%. Signing out remotely while Shawn is away would
   prevent completing the sign-in portion. Do not mark Task 10 complete yet.
2. **Task 11: numerical Mac/Windows render parity.** Create the shared fixture,
   compare gel crops and lane centroids, and consider ANGLE only if measured
   differences exceed the plan's limits. Smooth molecular circles alone do not
   establish gel-render parity. Also resolve the existing startup-file interface:
   `run.ps1 -Open` passes a path, but the app currently has no command-line loader.
3. **Task 12: installer.** Package, install, launch and uninstall the unsigned build.
4. **Task 13: signing checkpoint with Shawn.** Certificate choice, purchase and
   identity verification belong to Shawn; wire signing after those are available.
5. **Tasks 14–15:** Windows CI, release/build documentation, final cleanup and
   whole-change review. Confirm any screen/sign-in settings Shawn changed are
   restored. There is no signed installer or CI validation yet.

The detailed execution ledger and screenshots remain in the ignored
`.superpowers/sdd/2026-10-10-windows-port/` workspace on the Mac.
