# One-hour checkpoint (partial)

The unchanged two-hour run reached cycle60 on both renderers. Renderer/GPU
process IDs match the cycle10 baseline and the recorded RSS process inventory.
Both renderers are within the declared footprint-growth and lifetime-peak
limits at this checkpoint. GPU footprint change since10 is+18.2MiB on WebGPU
and−0.4MiB on WebGL2; renderer footprint changes are−0.6 and−1.2MiB.

Used JS heap growth since10 is561,844 bytes (WebGPU) and575,068 (WebGL2).
DOM and listener counters are unchanged. WebGL2's prior over-budget cycle30/40
samples remain failures of the original criterion; later smaller samples do not
erase them. Separate stopped-frame controls investigate the measurement issue.

These copies and eight compressed vmmap reports preserve the one-hour evidence.
The run is still live. This is not two-hour acceptance or final route-disposal
verification. Do not describe these per-checkpoint limits as an overall pass.
