# Native gel and buffer control defaults

Reference: pinned 5f51097 Config.h (TimelineBelowGel=true; EnableBufferSlides=false), GelSettingsView::makeSliders, BufferView, Slider::draw and drawTextLabel. Existing native gel-settings capture corroborates defaults.

- [x] Test native panel inventory/order, no duplicate timeline, rotation and concentration input inertness, and preservation of imported non-preset concentrations through Save Gel/Save Sample.
- [x] Restore four-control order, disabled rotation with three notches/no value label, unlabeled damage slider, missing separator and Buffer heading/preset text.
- [x] Disable concentration sliders while keeping presets active. Preserve normal value-label opacity; fade background/fill and icons independently as native does.
- [x] Verify both browser backends, unit suite and production build. Inspect rendered panel, documenting remaining exact typography/asset geometry gaps.
