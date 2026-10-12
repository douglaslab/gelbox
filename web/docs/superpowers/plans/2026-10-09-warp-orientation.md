# Native warp coordinate orientation

Contract docs/ROADMAP.md strict native parity. Pinned GelRender::smileBand produces negative Y displacement; shadeRect maps top of destination to source UV y=1. Surface control bytes are uploaded in native row order. Preserve those shared native coordinates; WebGPU converts source/control UV row orientation and displacement Y at its shader boundary. WebGL already uses native source UV orientation.

- [x] Direct GPU readback regressions for smile direction and cross-backend smile/well-damage/2D H2O/combinations, plus corrected source-backed smile sign test.
- [x] Restore native smile sign and WebGPU coordinate conversion; normalize every WebGL FBO sampling pass and final application/dev blit to native top-at-UV-one orientation.
- [x] Full tests/build, inspect changed screenshots, fresh review/fix pass, update evidence and commit.

These tests verify warp coordinate orientation and backend agreement, not all native pixel output. CPU field float/byte quantization, well-damage RNG and output-resolution sampling are separately unverified and remain required follow-up; current differences found in inspection must be recorded explicitly. Original-release native visual certification remains open.

Completed evidence and remaining native field differences are recorded in docs/STATUS.md. Fresh review found no functional blockers; minor comment/readability feedback addressed, targeted test rerun passed.
