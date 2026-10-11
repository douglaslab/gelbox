# Consistent native Windows accelerator branch

Gelbox5f51097 uses KeyEvent::ACCEL_DOWN for both global Render/Hover toggles
and transient hover preview. Cinder75f4821 maps that bit to Control on Windows
and Meta on other desktop targets. Pointer and file actions already used the
shared mapping; GelContext and useHoverLoupe still read metaKey directly.
They now use isNativeAccelerator as well.

Four development cases failed before the correction: Control preview/hover toggle
and Control-R, on each renderer. Tests explicitly set navigator.platform=Win32
on the current Mac. This verifies branch wiring; it is not Windows OS/browser
certification. Existing macOS Command behavior is covered by unchanged tests.
The compiled sequence creates a Control loupe, deletes it, re-establishes gel
rollover, toggles hover with Control-L and toggles Render with Control-R.

Two initial test failures are retained separately. The compiled sequence tried
to show a preview immediately after deleting its focused persistent loupe, with
no new gel pointer event. Adding that pointer move establishes the required
rollover. The existing resource lifecycle test captured a zero baseline before
asynchronous presentation setup finished, then compared the initialized59 objects
to zero. It now waits for nonzero resources before recording each baseline.
No renderer, resource disposal or timing threshold changed.

Final verification:44 hover/lifecycle visual cases,82 production cases,62
compatibility cases and3,054 unit tests pass. Build/TypeScript checks pass. The memory session's
original compiled assets were not rebuilt or replaced. Local staging is handled
from the separately verified source/build snapshot. Nothing is published.
