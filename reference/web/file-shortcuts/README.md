# Restore native file keyboard shortcuts

The source audit found no Open/Save keyboard handlers in the web implementation,
despite A04's broad shortcut claim. Native Gelbox5f51097 GelboxApp::keyDown handles
accelerator-O (Open), accelerator-S (Save Gel) and accelerator-Alt-S (Save Selected
Sample). It closes application settings first; Alt-S with no selected sample is
a no-op. These handlers run globally before forwarding to the focused view.

FileControls now installs a global capture listener with native platform
accelerator matching. Committed-current action references reuse the existing
menu actions, serialization, download and picker behavior without rebinding the
listener on each animation render. The handler closes settings and prevents the
browser's competing Open/Save action. An absent selection is ignored.

All six new Chromium shortcut cases failed before the correction. Afterward,
all24 file workflow visual cases,3,054 unit tests, TypeScript checks,80 compiled
production cases and60 Firefox/WebKit compatibility cases pass. The compiled
sequence opens a retained original-native document via the real chooser event,
saves the full current gel exactly, selects lane2, and saves exactly that native
sample with Alt-Command-S. This tests current callbacks after import and focus
changes, not just download creation. No error is introduced by the no-selection
shortcut. The retained logs identify the failing and passing runs.

Compiled checks used the isolated build directory from the modifier correction,
with these three changed source/test files copied from the current worktree.
The long memory run's original dist is untouched. This establishes source-guided
native shortcut behavior and engine-level chooser/download integration; actual
shipping Safari keyboard interception and a new original-native shortcut replay
remain separate from these automated cases.

The local website is refreshed from sourcee84627c in website commiteca3e42.
All626 tracked TypeScript workspace files matched the isolated source snapshot;
all223 packaged and HTTP-served hashes and both routes were verified. The memory
run retains its separate original build. Nothing was published.

After the subsequent platform-modifier correction, the full visual suite at
source8f308d8 passed969 cases with one intentional skip. `full-visual.log.gz`
retains the run. This includes the file shortcuts, macOS pointer modifiers,
simulated Windows modifier branch and existing graphics/selection workflows.
It is regression evidence; the outstanding paired native/platform requirements
remain open.

Shipping-browser follow-up found two limits that engine-only tests missed.
[Original native and Safari trace](../../native/replay/file-shortcuts/README.md)
now provides exact native gel/sample saves and a matching shipping Safari gel
save. Safari reports Option-Command-S as key ß/code KeyS; the handler now accepts
that physical S key when Option is held. Command-O is consumed by Safari before
the diagnostic page receives a keydown event. The earlier statement that the
handler prevents competing browser Open is therefore scoped to engines that
deliver that shortcut. In-app menu Open works in shipping Safari. Post-fix
shipping Save Sample replay and the Safari Open disposition remain outstanding.
