# M18 — Right-panel swap + cross-panel wiring

> **Phase 2, Milestone 18.** Tighten the orchestration so the inspector
> always reflects the right state, and verify the SampleView ↔ GelView
> hover/select round-trip end-to-end.

**Parent plan:** `2026-05-01-gelbox-ts-phase-2-overview.md`

---

## Files

**New:**
- `ts/tests/unit/inspectorSelector.test.ts`
- `ts/tests/visual/inspector-wiring.spec.ts`

**Modified:**
- `ts/src/lib/gel/gelState.ts` — add `selectInspectorView` selector +
  exported `InspectorView` type. `isInspectorVisible` becomes a thin
  wrapper.
- `ts/src/components/inspector/InspectorPanel.tsx` — switch from ad-hoc
  if/else to `selectInspectorView`; emit `data-view` attribute so e2e
  tests can assert which inspector is active.

## Tasks (all completed)

- [x] **18.1** Implement `selectInspectorView(state)` with the precedence
      gear → fragment → sample-settings → none.
- [x] **18.2** Refactor `InspectorPanel` to use the selector.
- [x] **18.3** Playwright: end-to-end inspector transitions (empty →
      sample-settings → fragment → gel-settings → fragment) +
      cross-panel rollover (band hover → SampleView ring) + cross-panel
      selection (SampleView click → Species).
- [x] **18.4** Unit: 7 selector tests covering each branch + the gear
      precedence + the empty-tube edge case.

## Decisions

- **Selector returns 'none' when nothing applies.** Earlier code had
  `isInspectorVisible` returning a boolean and `InspectorPanel`
  inferring the view; consolidating both into a 4-valued selector
  makes the panel's render path a clean switch.
- **Gear precedence wins over fragment.** Matches existing reducer
  semantics — `SET_INSPECTOR_MODE` set to 'gel-settings' is sticky
  until the user toggles the gear off, regardless of selection.
- **No new actions.** The reducer already supports the full state
  graph; M18 is pure refactor + tests.
