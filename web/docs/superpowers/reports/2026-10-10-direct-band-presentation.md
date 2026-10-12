# Direct-band multisample correction

Review range: `b1109e2..29e35ac`. Independent read-only review found no Critical,
Important or Minor issues. It verified retained mesh/driver/56 PNG hashes and
examined blending, opacity, orientation, lazy resource ownership, recovery and
DPR/current-scene initialization. No competing graphics workloads were run.

The original fractional-edge regressions failed on both backends/scales, up to
88 RGB levels. Bands now rasterize directly into the well presentation's shared
four-sample surface. Effects mode continues to use its existing image texture.
The final component comparisons exactly match 56 native RGB scenes per backend,
including two well rectangles crossing ordinary and fractional band geometry.

Final checks (terminal success, current product):

- `npm --prefix ts run test:unit`: 2,872 passed.
- `npm --prefix ts run test:visual`: 489 passed, one intentional skip.
- `npm --prefix ts run test:production`: four passed, fresh build/typecheck.
- Direct raster + presentation lifecycle + Render toggle checks: 42 passed.
- Native direct raster verification: 56 retained references, each captured
  twice identically.
- Native well oracle cross-check: 16 window and 32 colored references exact.

Reviewer boundaries retained as open requirements: original-release GUI parity
cannot be established by standalone CGL; fractional display scales, other GPUs
and performance acceptance need their own evidence. This correction makes no
claims for those gates. The review's pending-test condition is satisfied by the
full terminal results above. No deferred review findings remain.

See [native capture provenance and limits](../../../reference/native/modern/direct-band-scenes/README.md).
Changes are retained locally. The full web-app goal remains active; no push,
merge, publication or whole-app parity claim accompanies this increment.
