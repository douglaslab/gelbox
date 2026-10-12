# Application performance with Species representative preview

The existing built-app workload now includes the restored Species preview:
fifty gel bands, about 160 live sample particles, and three sparse loupes
(1, 5 and 1 particles). The preview's particle diagnostic repeats the sample's
count because it shares that engine; it is not another population.

Two ten-second steady windows plus sixty timeline pointer moves ran on each
backend. Raw reports include hardware/browser versions and timing limitations.
`manifest.json` records the base commit plus exact changed product source and
built asset hashes, since measurement preceded the local commit.

| Backend | Steady interval p95 | Callback CPU p95, windows 1/2 | Drag interval p95 | Resources baseline/end |
|---|---|---|---|---|
| WebGPU | 16.7 ms | 2.8 / 3.1 ms | 16.7 ms | 225 / 225 |
| WebGL2 | 16.7 ms | 2.5 / 2.4 ms | 16.7 ms | 29 / 29 |

Resource counts include the new renderer and remained stable through both
windows and dragging. Compared with the earlier native-edge run, each backend
tracks two additional objects. These are instrumented object counts, not
resident memory measurements; callback timing is not isolated GPU time or
input-to-photon latency. The runs do not establish an improvement in CPU cost,
a native performance comparison, a release budget, dense-loupe behavior or
long-duration stability. Both workload tests passed without page errors or
visible graphics failures.
