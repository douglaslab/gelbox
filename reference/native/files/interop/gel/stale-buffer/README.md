# Open buffer panel across native file loading

2026-10-10, original official Gelbox 1.0 executable at `/tmp/gel-native-reference/extracted/Gelbox/Gelbox.app`, SHA-256 `037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7`. Native UI actions used CUA; native source copies are from pinned commit `5f5109705279085fcf6bcac6c8be1c9806b6d3d6`.

## Reproduction and diagnosis

1. Start original release with its initial ladder; open gel settings (.5x TBE).
2. Cmd+O `../webgpu-edited.json`, a twelve-lane mixed fixture whose gel buffer is Tris 12.25, Borate 0, Acetate 8.5, EDTA 0.5.
3. Settings remains visible. Lane count updates to 12 and voltage to 84V, but buffer labels remain 44.5/44.5/0/1 and .5x TBE stays selected.
4. Click H2O and Cmd+S. Raw `native-after-stale-h2o.json` still contains the imported custom buffer. The click did not edit the loaded gel.
5. Close/reopen gel settings. Labels now show 12.5/0/8.5/0.5 (display quantization does not alter saved 12.25).
6. Click H2O and save again. Raw `native-after-rebound-h2o.json` contains all-zero gel buffer.

The source explains the observed behavior: `GelView::setGel` replaces its model and closes sample/loupe views, but does not recreate gel settings. `GelSettingsView::setup` binds its BufferView once; BufferView's closures access its retained `mGel`. Other gel settings sliders access `mGelView->getGel()` dynamically. This is a stale model binding, not merely stale labels. Saved sample lane loss is the separately recorded original writer defect in `../release/`.

The save dialog treated an absolute string in the name field as a literal colon-separated filename. That first raw output was moved into this directory without changing bytes. CUA screenshots were observed in the conversation; no new pixel golden is claimed.

## Web correction and bounded verification

The compiled web initially closed gel settings on import. `import-buffer.spec.ts` failed on both backends because the imported buffer panel was absent. `LOAD_GEL_STATE` now preserves the gel-settings mode while resetting sample/species selection as before. Buffer values remain bound to the current imported document.

Fresh build/full production suite: 26 passed, including both compiled import/preset/save cases and the existing native RGB cases. Full units: 2,943 passed. Related file/interoperability/settings/buffer browser regressions: 52 passed. The compiled test checks imported labels, H2O labels, and an exact saved document preserving every field except the intended gel buffer edit. Logs are retained here.

Keeping the panel bound to the current document is a divergence from the original stale-binding defect. **User acceptance is pending**; do not count this as strict parity or close W01. The panel lifetime correction itself matches native. No product change was needed for current-document binding.
