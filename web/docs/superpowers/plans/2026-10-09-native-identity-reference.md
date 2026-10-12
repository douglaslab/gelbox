# Native identity reference implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Capture native sample-reference identity, ownership and fragment-index transitions independently before migrating web state.

**Architecture:** Compile the pinned SampleFragRef declaration and method bodies plus Sample clone/remove methods verbatim. A minimal Sample storage adapter supplies only the fields those methods consume. A deterministic C++ driver emits named JSON observations; Python verifies contract and provenance. This is reference infrastructure, not a UI implementation.

**Tech Stack:** Python 3, clang++ C++17, standard library; no GUI/Cinder dependency.

**Spec:** docs/ROADMAP.md, strict native identity semantics and P0 independent evidence.

## Global Constraints

- Work only in the existing isolated worktree; read native `5f51097` using Git objects.
- Do not mutate sibling native checkout or original web checkout.
- Preserve native sample pointer identity and raw fragment indices, including invalid references.
- No serialized pointer IDs; name objects only in the capture adapter.
- Do not claim GUI, dye-compaction, RNG, rendering or web migration certification.

## Review Focus

- Exact extraction and provenance: no handwritten substitutes for the native methods.
- Shared ownership: named output must not accidentally retain the sample under test.
- Invalid indices/equality: invalid does not imply cleared or unequal.
- Ancestry direction and one-hop versus root traversal; invalid origins terminate.
- Copy identity: equal serialized IDs/data must not become the same sample reference.

### Task 1: Capture native identity transitions

**Files:** reference/native/numerical/{build-identity.py,identity-driver.cpp,identity-outputs.json,identity-provenance.json,test_identity.py,README.md}; docs/STATUS.md.

**Interfaces:** Driver emits a JSON map of named observations; Python verifies exact expected map and hashes. Extracted declarations/bodies are scratch-only compiler inputs.

- [x] Write a contract test requiring expected pointer/index/ownership observations and provenance.
- [x] Run `python3 reference/native/numerical/test_identity.py`: expected FAIL because capture is absent.
- [x] Implement extraction, adapter, scenario driver and double capture; record compiler/source/executable/fixture hashes.
- [x] Run build and test: expected repeat-identical output and exact contract match.
- [x] Probe test sensitivity by changing a captured observation in scratch and require rejection; do not leave fixture altered.
- [x] Document scope and source-backed web discrepancies; commit.
- [x] Complete task with `python3 reference/native/numerical/test_identity.py`.

Final fresh read-only review covers this increment's committed range. Fix important findings with reproducing tests; keep broader identity migration next in roadmap.
