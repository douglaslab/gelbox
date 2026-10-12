# Original-release Gel writer defect and recovery

This replay used the unmodified official Gelbox 1.0 executable, through CUA
native UI operations. It resolves the preceding harness-only uncertainty about
the keyed Samples writer behavior. The executable hash and artifact hashes are
recorded in manifest.json. Equivalence of every binary behavior to the pinned
source commit remains unproven.

Sequence:

1. Open `../webgpu-edited.json` through Cmd+O. This is the retained twelve-lane
   web UI export; the WebGL2 export is byte-identical. The native scene displays
   tubes in lanes 1, 5 and 12, with gel bands in lanes 1 and 12 (`opened.jpg`).
2. Cmd+S saves `reread.json` (raw release bytes). Samples is an object with two
   keys: empty string maps to null; `Sample` maps to the final lane's sample.
   Earlier samples and lane positions have been lost. Other gel settings match.
3. Cmd+O reloads `reread.json`. The original release shows seven lanes and the
   surviving sample in lane 2 (`reloaded.jpg`). Cmd+S saves
   `recovered-native.json`, now a normal seven-lane array because the final lane
   is empty.
4. Web file-input import and Save Gel on both backends produce
   `webgpu-recovered.json` and `webgl2-recovered.json`. Both JSON documents match
   `recovered-native.json` exactly. The native headless reader independently
   records the recovered loaded fields in `loaded-state.json`.

The importer now accepts the native object collection and visits its children
in sorted member order, matching JsonTree/jsoncpp. Two unit tests failed before
this correction; scalar/invalid child validation remains intact. Browser tests
exercise the real file control and download. The exporter continues writing
arrays, preserving all visible lanes. Deliberately reproducing native data loss
would violate the file-preservation requirement; this is an explicit parity
exception, not an unobserved implementation difference. Lost lanes cannot be
inferred or restored from the native-produced file.

Screenshots are CUA JPEG observations with display conversion, cursor overlays
and unfrozen rendering. They certify visible lane placement for this sequence,
not pixel equality. The gel buffer panel left open during file loading retained
old .5x TBE labels, while saved gel data correctly contained the imported custom
buffer. That composed-panel observation remains a separate parity decision; it
is not evidence that the document's buffer was overwritten.
