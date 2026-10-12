# Shipping Safari tab background and return

On 2026-10-11, shipping Safari 27.0.1 (22625.1.29.11.28), macOS 27.0.1
(26A434), loaded the locally prepared website at
`http://127.0.0.1:8766/gelbox/app/`. Website commit `38e5335` packages runtime
source `ff35ea9`. All 223 files in its retained `website-release.json` were
verified both on disk and over HTTP. The full browser window screenshot was
2912×2002 pixels; no display or browser zoom setting was changed.

## Actual UI sequence

1. Open a new Safari tab at the website preview. Click **Lane 1 sample** in the
   startup ladder, then use **Application settings → Save Gel**. Retain the
   downloaded document as `before.json`.
2. Observe the populated Sample panel and rendered ladder. Click Safari's
   **Start Page** tab; the accessibility tree identifies Start Page as active
   and Gelbox as inactive. Return by clicking the **Gelbox** tab.
3. Observe that the Sample panel remains open, populated and in place, with the
   seven-lane ladder and timeline at 3:00. Two screenshots taken after returning
   show different particle arrangements, establishing resumed visible animation.
   Save Gel again and retain it as `after-first.json`.
4. Click **Start Page** again. Clock observations at 17:38:26 and 17:38:57 UTC
   bracket at least 31 seconds with the Gelbox tab inactive. Return to Gelbox;
   observe the populated Sample panel, ladder and 3:00 timeline. Save Gel again
   and retain it as `after-second.json`.

Both resumed downloads equal the baseline in every parsed JSON field, with no
normalization. They are also byte-identical. Download timestamps and SHA-256
hashes are retained in `provenance.json`. Save remained usable after both returns.
No reload, document import, page-script injection, synthetic visibility event,
WebDriver override, or application code change was used. The native reference
fixture waiting for manual Option-drag was left untouched.

## Scope

This supplies real shipping-browser tab-switch and visible-resume evidence at
the actual website path. CUA screenshots were inspected during the sequence;
they are visual observations, not retained pixel goldens. No internal view
identity, GPU backend, visibility-event log, console errors or hidden-frame
counter was measured. In particular, it does not prove that simulation stopped
while hidden. Those instrumented properties remain supported only by the
separately scoped [WebKit engine test](../webkit-activity/README.md).

This sample-only sequence does not certify persistent-loupe resume, long
suspension, OS sleep, physical monitor/DPR transitions, Firefox background
behavior, or all of W07. No publication or new browser permission was required.

To verify retained documents from the repository root:

```sh
python3 - <<'PY'
import json
from pathlib import Path
p = Path('reference/web/lifecycle/safari-tab-resume')
before = json.loads((p / 'before.json').read_text())
for name in ('after-first.json', 'after-second.json'):
    assert json.loads((p / name).read_text()) == before
    assert (p / name).read_bytes() == (p / 'before.json').read_bytes()
print('Both resumed documents match the baseline')
PY
```
