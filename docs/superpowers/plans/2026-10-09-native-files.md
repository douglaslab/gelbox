# Native files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make native Gelbox JSON documents usable in the web application without losing scientific data or sample metadata.

**Architecture:** Keep the existing simulation data shapes and deserialize result union. Add a native codec at the file boundary, preserving native metadata as optional Sample fields. Retain legacy web import; switch user-facing export only when native output is covered.

**Tech Stack:** TypeScript, Vitest, React.

**Spec:** docs/ROADMAP.md, P1 file compatibility; native src/Sample.cpp, src/Gel.cpp and include/Sample.h.

## Global Constraints

- Strict native behavior and visual parity first; improvements afterward.
- Native source target is 5f51097; the official executable's exact revision remains unverified.
- Do not serialize runtime source pointers or view state.
- This plan covers JSON. XML, shell controls, and the remaining roadmap remain required follow-up work.

## Review Focus

- Missing fields must use native constructor defaults, not guessed ladder values.
- Sparse lanes must retain order; native limits displayed lanes to 7–20.
- Explicit malformed nested values must fail before entering simulation.
- Unknown dye strings follow native fallback to ordinary species.
- Internal sample IDs must not replace native metadata IDs.

### Task 1: Native JSON import

**Files:** Create `ts/src/lib/gel/nativeFile.ts`, `ts/tests/unit/nativeFile.test.ts`; modify `ts/src/lib/gel/serialize.ts`, `ts/src/lib/sim/sample.ts`.

**Interfaces:** `deserializeFile(text: string): DeserializedFile` recognizes `Gelbox.version = "1.0"` and `type = "sample" | "gel"`. Native decoder returns the existing union. Optional Sample metadata: `name`, `icon`, `iconScale`, `id`.

- [ ] Add tests loading the native exported fixture: seven lanes, six nulls, 11 fragments, first bases 10002/mass 42, metadata name `1kb ladder`, iconScale 0.5, id -1, time 1, voltage 70.
- [ ] Add independent literal cases for native defaults, dyes, aggregates, missing buffers versus empty buffers, sparse lanes and nested malformed values.
- [ ] Run `npm run test:unit -- tests/unit/nativeFile.test.ts`; verify failures from unrecognized native format.
- [ ] Implement mapping and typed validation. Preserve out-of-slider finite values; reject wrong types/nonfinite numbers. Derive default layout scale for 390×520 with 20-unit margins. Preserve stored samples beyond the displayed native lane limit.
- [ ] Run unit suite and typecheck; commit import changes.

### Task 2: Native export and interchange

**Files:** Modify native codec and serializer, existing serialization tests and FileControls as required.

**Interfaces:** `serializeSample` and `serializeGelState` emit native wrappers. Legacy formats remain readable.

- [ ] Add independent expected native JSON assertions, including dyes, metadata, empty lanes and omission of runtime state. Update old format assertions to test legacy import explicitly.
- [ ] Watch these assertions fail, then implement native export.
- [ ] Verify web output opens in the native application; save back and compare semantic state.
- [ ] Run unit suite, typecheck and build; commit export changes.

Final review occurs after both tasks. Visible Open/Save mounting and XML are the next P1 increment, not waived by completion of this plan.
