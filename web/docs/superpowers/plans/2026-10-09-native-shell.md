# Native shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Match native window-relative gel and panel geometry and remove web-only application chrome.
**Architecture:** Render GelPage directly at root and /gel, keeping engineering routes under AppLayout. Stage computes native window resize offsets without scaling panel contents. Braces share inspector origins rather than adding another gutter.
**Tech Stack:** React, TypeScript, Playwright.
**Spec:** docs/ROADMAP.md P1; native GelboxApp::mLayoutFunction, GelView::layout, SampleView panel layout, reference/native/captures.

## Global Constraints

- Strict native behavior and visual parity first; improvements afterward.
- Default native client size 1365×768; gel origin 208,124 and size 390×520.
- Native resize: x shifts 40% of positive width delta or 80% of negative delta; y shifts 50% of height delta; rounded and clamped to x>=8,y>=64.
- Sample origin 30 pixels beyond gel; inspector origin 31 beyond sample. Brace is within inspector's 303-pixel width.
- Gel settings occupies origin 30 pixels beyond gel instead of species/sample panels.
- Preserve dev routes. Native fonts available on macOS are used, without bundling system font files.

## Review Focus

- Narrow windows must retain panel DOM and fixed dimensions.
- Gel settings must not overlap a visible molecular view.
- Root route must open the actual gel without navigation chrome.
- Empty lanes must not display sample icons; initial remembered lane is not selection.
- Remembered dark mode must not alter parity workspace appearance.

### Task 1: Native shell and panel geometry

**Files:** App.tsx, Stage.tsx/css, GelPage.tsx, MicrotubeRow.tsx/css, layout.ts; tests/visual/stage.spec.ts, smoke.spec.ts.

- [x] Replace browser-padding assertions with native pixel coordinates at 1365×768: gel 208,124; sample 628,124; inspector+brace 1021,124. Assert gel settings at 628,124.
- [x] Replace skipped reflow test with fixed geometry at 800×600 (gel 8,64); keep sample/inspector DOM and allow horizontal access.
- [x] Add root route and empty-lane icon/selection assertions; watch failures before implementation.
- [x] Implement routing, native resize geometry, fonts, and icon visibility. Hide debug selection text visually while retaining its test hook.
- [x] Run targeted tests; inspect screenshot against native capture. Then run unit suite, both backend browser suites, typecheck/build. Review any baseline differences before changing images.
- [x] Commit and obtain fresh review. Record unresolved visual differences rather than claiming full screenshot parity.

Browser adaptation: scrolling exposes fixed native panels beyond small browser viewports. Native clips to the window. This adaptation remains explicitly recorded pending final parity acceptance.
