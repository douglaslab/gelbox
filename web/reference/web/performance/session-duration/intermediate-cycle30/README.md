# Intermediate cycle30 observation

These are copies of the ongoing run's incremental checkpoints, not completed
acceptance reports. At cycle30 WebGL2 used heap grew1,221,520 bytes from cycle10,
exceeding the predeclared1,048,576-byte ceiling. WebGPU grew395,896 bytes.
DOM/listener counts remain unchanged in both. The existing run remains alive
and is allowed to finish for its complete trend and remaining footprint samples.
The verifier will reject this WebGL2 result even if later heap samples shrink.
Do not raise the limit or restart the run to discard the failed checkpoint.

A separate diagnostic repeats30 cycles without the60-second holds and records
heap snapshots at10/30. It asks whether short cycle churn alone reproduces the
growth and which object categories retain bytes. It is not a replacement for
the two-hour workload, and does not modify that workload or its compiled build.
No cause or product defect is established by the aggregate heap observation.
