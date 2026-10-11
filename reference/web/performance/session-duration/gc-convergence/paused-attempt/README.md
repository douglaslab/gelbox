# Debugger-pause sampling attempt (failed diagnostic)

The separate30-cycle, zero-hold WebGL2 control reached the first paused sample,
then exceeded its150-second test timeout. It did not emit a completed memory
report. The exception surfaced in cleanup at Debugger.resume after test teardown
closed the target. Because the finally error masks the original awaited call,
this log does not establish whether collection or heap query failed to return.
The pause event was observed before entering that try/finally block.

This is a failed sampling technique, not an application acceptance result. The
original two-hour test continues separately and was not attached to, paused,
modified, or restarted. Do not retry this technique without finer protocol
logging and a bounded per-command timeout. A browser lifecycle freeze, which
allows protocol evaluation without a JS debugger pause, is a distinct possible
measurement control; it has not been validated here.
