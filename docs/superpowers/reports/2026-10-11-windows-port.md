# Windows port execution record

All15plan tasks completed; Task13 changed to unsigned distribution by user instruction.
Fresh whole-change review: no critical or important findings.

## Decisions

- Ruling: Work in existing master checkout — user explicitly requested this branch and location — cost if wrong: changes are on master.
- Ruling: Place Task 2 bootstrap wrapper inside Cinder, never code/gelbox-bootstrap — user restricts code directory writes to Cinder and gelbox — cost if wrong: temporary wrapper must be removed after bootstrap.
- Ruling: Use one commit per task except root-cause compiler fixes, explicitly requested separately; combine Task 12 ignore change with installer — user's commit granularity overrides conflicting plan steps — cost if wrong: less granular installer history.
- Ruling: Use build-win-Release consistently — wrapper and downstream commands agree — cost if wrong: external scripts expecting build-win need updating.
- Ruling: Verify asset contents against source instead of fixed count 17 — Task 6 adds fonts — cost if wrong: need investigate any unexpected source entries.
- Task 2: Ruling: strip surrounding argument quotes with %~1/%~2 and use quoted set assignments — plan wrapper double-quotes paths containing spaces — cost if wrong: ordinary batch argument semantics need adjustment.
- Task 2: Ruling: check config/v143/cinder.lib and config/cinderConfig.cmake — actual Cinder target export places them separately; initial full build succeeded but wrapper failed its incorrect dir check — cost if wrong: wrapper tied to pinned v143 layout. Full build output read including warnings; no compiler errors.
- Task 4: Ruling: assemble original icon frames explicitly and derive only 48px from 64px — plan auto-resize command upscaled the first 16px source into a visibly blurry 256px icon — cost if wrong: frame selection differs from intended artwork.
- Task 5: Ruling: replace physical Help click with temporary direct invocation of the unchanged button callback — CUA consistently delivered mouse coordinates [214,830] outside the help frame regardless of requested point; keyboard worked — cost if wrong: physical hit-testing remains for Task 10. Temporary callback invocation opened Chrome at douglaslab.org/gelbox, verified through browser AX. All diagnostic code removed and original bundle identifier restored.
- Task 6: Ruling: Windows installed-name check before Font construction — pinned Cinder GDI backend silently substitutes unknown names, contrary to plan — cost if wrong: a differently named installed face uses bundled fallback.
- Task 6: Ruling: route additional Font sites in GelboxApp, SampleSettingsView, and heading descent through helper — audit found these beyond listed files — cost if wrong: unintended typography change, covered by Mac checks.
- Task 6: Ruling: fetch license from same 3.052R tag — release TTF zip contains no license — cost if wrong: incorrect licensing provenance; downloaded OFL text names Adobe Source.
- Task 7: Ruling: keep raw getModifierKeys unchanged — Cinder ACCEL_DOWN aliases CTRL_DOWN on MSW and META_DOWN on Mac, both already recorded — cost if wrong: platform alias assumptions need updating with Cinder.
- Task 7: Mac Cmd-S and Cmd-O dialogs verified through CUA and cancelled. Ruling: validate Mac hover mask equivalence from Cinder's ACCEL_DOWN=META_DOWN and defer physical hover verification to Task 10 — CUA delivers fixed off-window mouse coordinates — cost if wrong: an interaction regression may surface in the Windows functional pass.
- Task 8: Ruling: apply assetScale to raster text scales as well as images — audit found int fields and getUIFont(int) truncating 1.5 to 1, contrary to plan claim that remaining sites multiply floats — cost if wrong: text uses 2x rasterization above 100% with modest extra texture memory. Keep real float scale for gel renderer and scissor coordinates.
- Task 8: Ruling: pass ButtonView's raster scale into renderUI — its string overload rendered at 1x then divided dimensions by 2, producing half-sized labels — cost if wrong: fixes existing Retina text button sizing as well as fractional Windows sizing.
- Task 9: Ruling: duplicate stdout's descriptor onto reopened stderr instead of two independent offsets — plan's separate w/a streams can overwrite interleaved diagnostics — cost if wrong: CRT-specific logging requires runtime validation. Windows uses wide environment/path APIs for Unicode log locations.
- Task 9: Ruling: use ScheduledTasks cmdlets with quoted UTF-8 launcher scripts, scoped process checks/stopping, fresh output checks, -Exe override, and scripts/output under gelbox build directories — supports spaces/non-ASCII, installer launch, and user's path restriction without fragile cmd quoting — cost if wrong: scheduled-task execution still needs console-session verification.
- Task 9: Ruling: initial gel contains the default ladder, not the empty gel described by plan — matches existing makeGel behavior and Mac startup — cost if wrong: initial-state expectation needs revisiting.
- Task 10 remote Unicode test: copied user gel to build-win-Release/Gelbox test ü/round-trip.json, Ctrl-O through native dialog and native WM_DROPFILES both render correctly; saving each loaded gel yields byte-identical JSON to original. Ruling: use build directory for Unicode/relocation tests, honoring user Windows write scope; native drop message exercises Cinder drop handler, while actual Explorer JSON drag was already confirmed by user — cost if wrong: XML/PNG Explorer initiation itself still needs physical verification.
- Task 10: Ruling: interpret same physical size as consistent logical layout under OS scaling — native150% correctly scales physical pixels by1.5, with sharp2x raster assets, not identical pixel dimensions — cost if wrong: requirement wording needs clarification; native Windows scaling would otherwise be defeated. User restored100%, app relaunched, final DPI check recorded.
- Task 13: Ruling: user explicitly chose unsigned distribution; skip signing purchase/integration and disclose Windows unsigned / Mac ad-hoc, not notarized status. New goal includes revised website and uploading latest Mac build.
- Task 11: Ruling: generate the reference JSON from bundled ladder XML and two explicit custom samples, then load/save in Mac app — repeatable exact fixture construction; cost if wrong: fixture schema rejected by native app. Eight lanes match comparison defaults.
- Task 11: Ruling: comparison now fails its process on threshold violations and treats absent bands explicitly — plan only prints flags, which cannot gate packaging; cost if wrong: stricter detection of blank lanes. Synthetic tests observed RED missing script, then GREEN5/5.
- Task 11: Ruling: generate fixture directly and verify it loads in both native apps; Mac save dialog automation targets another same-bundle instance, so do not overwrite an uncertain window's file. The schema and rendered four populated lanes/60min are verified; cost if wrong: native load verification misses serialization differences (Task10 already covers round trips).
- Task 11: Ruling: crop gel below wells at208,149,390,495 rather than including well outlines — native Retina UI outline brightness is82 versus163 on Windows and biases sparse-lane centroids despite identical band rows; cost if wrong: not comparing well stroke appearance, which is explicitly outside band-position parity. Mac exact2x capture normalized with BOX averaging (Lanczos introduces white border ringing). Source Git blob hashes identical across platforms. NativeGL PASS MAD0.0861,maxcentroid0.1568; noANGLE.
- Task 12: Ruling: release1.0.2 for both platforms because site already stages1.0.1; preserves versioned old downloads and identifies Windows-port fixes. Combine installer and ignore commits into one per user task rule. Verify recursive asset hashes, not obsolete top-level count17 (fonts made18).
- Task 12: Ruling: Inno6.7.3 winget installed per-user under LOCALAPPDATA/Programs, not plan hardcodedProgramFiles(x86); wrapper probes standard locations. cost if wrong: alternatecustomlocations require configuration. Unsigned package1.0.2 built3,635,845bytes; staticCRT-MT verified.
- Task 14: Ruling: artifact compressed1.67MB rather than plan approximate10MB; downloaded and verifiedexe+99assets, so size is not a correctness gate. Added explicit command failure propagation and read-onlycontents permission.
- Task 15: Ruling: no screen/power/sign-in settings were changed by agent; do not invent previousvalues. User restored100% confirmedDPI96. Removed all4Gelboxtesttasks and stoppedtestprocesses. cost if wrong: externaluserchangesnotinrecordremainuserowned.
- Final: Ruling: scientificmodelaccuracy remains separate per user finishreleasefirst — unchangedmodel released; cost if wrong: existing scientificapproximationsremain.
- Final: Ruling: preexistingwebsitebrowserpreviewchanges excluded from portreview — separatework, publicationinclusionawaitsuserpreference; cost if wrong: notfreshlyauditedhere.
- Final: Ruling: publication/downloadavailability remains executorverification — reviewer codeapprovaldoesnotestablishliveURLs; cost if wrong: brokenpublicdownload.
- Final: Ruling: developer signing/notarization intentionally excluded by explicituserdecision — discloseunsigned/ad-hocstatus; cost if wrong: OSwarningsandmanageddevicerestrictions.
- Final: Ruling: finish onexistingmasterwithauthorizedpushes, not a new merge/PR menu — user chosemasterandpushes; cost if wrong: alreadysharedhistory.

## Deferred minor

The comparison tool uses overall image difference and one brightness-weighted
centroid per lane. It can miss a single missing band if the remaining bands
balance around the same centroid. Its README claim about missing-band detection
is broader than this guarantee. This limits the automated check; the reviewed
Mac/Windows captures passed and did not show a missing band.

## Verification

See [Windows verification](../../../tools/win/TESTING.md) and
[build/parity documentation](../../../tools/win/README.md).
CI run38207870780passed and its artifact contains the executable plus99assets.
The Mac1.0.2disk image was verified and launched from a read-only mount.
Windows1.0.2installed, launched and uninstalled with all99assets hash-matching.

## Follow-up

User chose release first, then reference-based model improvements. See
[model research](../../research/2026-10-11-gel-model-reference.md).
