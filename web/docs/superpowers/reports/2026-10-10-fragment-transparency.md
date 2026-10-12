# Fragment transparency and composition boundary

## Outcome and scope

Removed the white geometric-coverage cutout. Fragment well/body rendering now
accumulates premultiplied source-over RGBA on its MSAA4 surface, resolves alpha,
and lets earlier content show through. Both GPU backends retain their opaque
presentation path. The obsolete coverage shaders and pass were removed.
Separate well lines also accumulate alpha correctly in transparent mode.

This is a behavior correction, **not complete native visual parity**. A shared
native framebuffer preserves sample correlation between intersecting edges that
independent browser layers cannot retain after resolving. The next rendering
increment must address that boundary; no release/merge or goal completion is
claimed. The larger app-wide completion gates remain open.

## Independent evidence

- 90 solid-background native captures (15 cases × 2 DPR × 3 backgrounds),
  repeated and freshly verified. White results exactly match prior native
  references. Production components are compared across both backends.
- Baseline `4115939`: 120/180 exact mismatches, maximum RGB error 229/255.
- Transparent prototype and final renderer: 180/180 exact mismatches, maximum
  2/255 for those solid backgrounds. The prototype has 253,586 differing
  channels: 253,138 differ by one, 448 by two; 212,452,414 are exact.
- New intersecting-edge native probe: 8 captures including the underlay alone,
  repeated and freshly verified. The browser uses that exact resolved underlay
  image beneath the real FragmentWell. All 12 composed comparisons differ:
  maximum24/255 for empty/crossing, 9/255 round DPR1, 8/255 round DPR2.
  Both backends agree. The solid-background bound does not generalize.

References and complete counts:
[solid](../../../reference/web/fragment-background-scenes/README.md),
[intersecting edges](../../../reference/web/fragment-edge-scenes/README.md).
These are standalone pinned native CGL probes, not original-release GUI captures.

## Regression and review

The prior production implementation failed all eight revised solid-background
and half-transparent-brace tests. The brace check observed a 13-level channel
error. Tests now preserve the brace at fade .5 and cover it at fade1. A nearly
invisible particle preserves magenta underlay outside the opaque well.
The normal native-well regression enforces a 2/255 solid-background bound;
the expanded viewport/DPR crop enforces 1/255 for its particular scene.
Dedicated exact audits retain zero tolerance and intentionally fail, making the
unresolved acceptance visible rather than silently redefining parity.

Read-only review found no introduced alpha/resource bug. It identified two
Important items: exact parity is unmet (retained as an open requirement), and
intersecting-edge behavior needed native measurement. The added edge reference
confirmed the latter architectural limitation. Declined areas—original GUI,
other browsers/fractional DPR, unchanged animation/picking—remain open in the
broader roadmap. No second review or release approval was inferred.

## Fresh verification

- Unit suite: 2,909 passed.
- Full normal browser suite: 525 passed, one intentional duplicate skipped.
- TypeScript/Vite production build passed.
- Built app root/subpath checks: four passed.
- Exact solid-background audit: four tests failed; 180 comparisons retained.
- Exact intersecting-edge audit: four tests failed; 12 comparisons retained.
- Native edge capture and fresh verification: eight images each passed.
- Native solid capture and fresh verification: 90 images each passed.

Logs: `/tmp/gel-fragment-transparency-{red,green,unit,full,build,production}.log`,
`/tmp/gel-fragment-background-final.log`, `/tmp/gel-fragment-edge-final.log`,
`/tmp/gel-fragment-edge-reference{,-verify}.log`.
Initial green run had four expected old zero-tolerance overflow-crop failures;
its final bounded regression passed in the full suite. No golden was updated to
match web output. Source hashes and prototype patch are retained with reports.
