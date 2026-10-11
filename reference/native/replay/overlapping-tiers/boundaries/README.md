# Original-executable solver boundary checks — prepared, not captured

Nine input documents are derived from the exact cases identified in the
candidate/solver-comparison.json mismatch list. Their time, voltage, well damage
and TBE buffers match those cases. The sample is one3001bp/125ng monomer with
aspect1 and degradation0; color is binary-exact to avoid an unrelated color
serialization boundary.

For each fresh document, right-click lane1 at gel-local y=request.target.
At the observed1365×768 client/DPR2 window, CUA physical position is
(472,304+2*target). Native newFragmentAtPos calls solveBasePairForY at that integer
position with aspect1/aggregate1, avoiding initial-band drag-offset uncertainty.
Save Sample to a distinct native checkpoint. Compare the created fragment's
Bases and inspect its aspect/aggregate/degradation to confirm the solver inputs;
random color/mass are not equality oracles. A compiled paired UI replay should
use client (236,124+target) and retain the resulting document as well.

No native boundary result has been obtained. On this attempt CUA returned
cgWindowNotFound for both the isolated application path and unique bundle ID,
although PID3764 remained alive. A request to restore its visible window is
pending. Do not treat these prepared input files as native observations.
