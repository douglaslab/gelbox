# Short-cycle heap attribution control

The active two-hour WebGL2 run exceeded its declared heap-growth budget at
cycle30. This separate diagnostic uses the same fixed compiled build, Chromium
153/Metal runner, graphics-resource instrumentation and interactions. It changes
the populated-view hold to zero, runs30 cycles, and takes CDP heap snapshots at
cycles10/30. It does not touch the active two-hour run or rebuild its dist.

Command from the web worktree `ts` directory:

```
GEL_SESSION_HOLD_MS=0 GEL_LIFECYCLE_CYCLES=30 GEL_LIFECYCLE_MEASURE_HEAP=1 node /private/tmp/gel-browser-compat-1.64/node_modules/@playwright/test/cli.js test -c /private/tmp/gel-browser-compat-1.64/heap-attribution/metal.config.ts --project=chromium-webgl2 --output=/tmp/gel-heap-attribution
```

The explicit-resource/DOM workflow passed in10.8seconds. This test's exit status
does not enforce the release heap budget. Used heap after forced GC grew from
6,612,944 at cycle10 to7,936,520 at30 (+1,323,576 bytes). The short workload thus
also exceeds1MiB; minute-long holds are not necessary for the observed growth.
Route exit measured6,606,608 bytes, but does not independently identify what was
released. Snapshot collection adds instrumentation and can change GC timing;
this run cannot replace the untouched two-hour acceptance observations.

`shallow-delta.json.gz` groups snapshot node self_size and counts by node type/name.
The largest positive differences include InstructionStream (+268,672 bytes),
TrustedByteArray (+78,728), native WeakArrayList (+40,908), ProtectedFixedArray
(+32,940), DOMRectReadOnly (+31,920), LayoutShift (+14,440), and
LayoutShiftAttribution (+11,400). These are **shallow allocation differences**,
not retained-size/dominator attribution. Snapshot sizes need not equal the
separately sampled Runtime.getHeapUsage. They suggest compiled-code/browser
records deserve investigation, but do not prove bounded warm-up or rule out an
application leak. The declared budget remains unchanged and failed.

Next: inspect object retainers and browser performance-entry/code-cache bounds,
and compare later checkpoints of the existing long run. Do not rerun another
long soak until a concrete cause or measurement correction is established.

## Retainer follow-up

`inspect-retainers.py` reads the retained snapshots without touching a live
browser. It prints the largest newly allocated code nodes, their incoming code
and closure edges, and the first newly allocated native LayoutShift node's
shortest non-weak path to a snapshot root. The script is specific to the pinned
snapshot format (six node fields and three edge fields as retained here).
`retainer-paths.txt` preserves its actual output; `type-deltas.json` summarizes
net shallow allocation differences by type.

The eight largest new InstructionStream nodes are attached through Code objects
to closures M9, R, A2, parseAttributeSelector, lx, draw, c2 and Lx.
Seven closure IDs already existed at cycle10; draw is a new closure ID, so its
individual lifetime is not established by this comparison.
Seven identify served Gelbox bundle URLs (including renderer/global-warp code);
parseAttributeSelector is runner-injected selector code. This establishes code
compilation/tiering as a contributor, not that all growth is test overhead.
The new LayoutShift node reaches the browser Performance entry vector; one
shortest root path then traverses the test runner's UtilityScript builtins.
That shortest path alone does not establish exclusive ownership by automation.

Among positive non-code/non-native type-and-name groups, only an Array object
(+16 bytes) and its object elements (+12 bytes) grew. This is a net shallow
comparison, not proof that individual objects never leak or that the production
long run has identical retainers. The snapshots narrow the next investigation;
they do not change the original budget, establish a finite cache bound, or
turn the ongoing acceptance run into a pass.

## Pinned browser buffer bound

A separate launch of the same executable reports Chromium revision
`971a7443b0c9b0a9b2860529b33331b76077ec62` through Browser.getVersion. Its
[Performance implementation](https://chromium.googlesource.com/chromium/src/+/971a7443b0c9b0a9b2860529b33331b76077ec62/third_party/blink/renderer/core/timing/performance.cc)
caps the layout-shift buffer at150 entries; insertion stops and the dropped-entry
counter increments after the cap. The exact source was retrieved using Gitiles
format=TEXT and decoded from base64; its hash and observed values are retained in
`chromium-buffer-bound.json`. The web browsing tool could not open this revision,
but the direct official Gitiles request succeeded.

The snapshots contain55 LayoutShift objects at10 and150 at30, with165→450
attribution objects and330→900 rectangle objects. These match a filled browser
buffer (three source attributions/two rectangles each in this observed workload).
This supplies a source-supported bound for the identified layout-shift retention.
It does not bound compiled-code memory or the whole heap, and does not change
the failed acceptance result. No browser flags or application behavior changed.
