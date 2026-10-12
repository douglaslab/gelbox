# Native particle picking

Strict parity under docs/ROADMAP.md. Extract pinned pickPart/pickFragment and Part transforms verbatim into the native numerical harness. Replay controlled particles and probe points; discrete hit indices/fragment ownership must match. Restore native rotation, multimer spacing and minimum-radius ordering. Retain native reverse draw order and picking faded/dead parts until removed. Mesh generation remains a separate required increment.

- [x] Capture independent native picking scenarios and reproduce web failures.
- [x] Correct picking transforms and pass exact differential assertions.
- [x] Full unit/browser/build verification, fresh review, evidence and commit.
