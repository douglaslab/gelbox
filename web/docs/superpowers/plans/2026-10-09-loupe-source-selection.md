# Loupe source selection

Under docs/ROADMAP.md strict parity, use pinned SampleFragRef::isa/setToOrigin and SampleView::selectFragment/tick as authority. Native open-sample context is distinct from shared species selection; selecting a loupe source does not switch panels. Return one source reference per synthetic fragment, compare indices with existing native originFragment captures, and use shared selection/rollover for gel/sample/loupe highlighting. All synthetic fragments with one origin highlight together. Focus the existing sample inspector by native rollover-then-selection precedence, and use shared selection for keyboard cycling. Clear loupe-owned rollover on close without clearing another view's newer rollover.

- [x] Failing native-origin, shared-focus and browser loupe interaction regressions.
- [x] Wire ancestry and shared selection without changing open-panel context.
- [x] Full checks, inspect image changes, fresh review, evidence and commit.

Stable document identity, full loupe frame/drag/focus lifecycle, seed integration, and off-document sample reference retention remain open required increments. Current ancestry is derived afresh with each synthetic sample from current document indices, not serialized into native files.

Evidence and limitations: docs/STATUS.md, “Loupe source selection and inspector focus.” Fresh review findings both reproduced and fixed; final 2,562 unit / 188 browser / build checks pass.
