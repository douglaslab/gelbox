// Visual specs excluded from the Linux CI gate (GEL_VISUAL_SCOPE=linux-ci).
// GitHub's ubuntu runners have no WebGPU adapter and render WebGL2 through
// SwiftShader, so these files cannot pass there. They remain part of the full
// suite, which is run locally on macOS hardware before landing renderer work.

// Switch to, or acquire, a WebGPU adapter (requestAdapter returns null on Linux).
const needsWebGPU=[
 'gel-presentation-lifecycle.spec.ts',
 'gpu-allocation-rollback.spec.ts',
 'renderer-frame-error.spec.ts',
 'renderer-loss.spec.ts',
 'renderer-setup-fallback.spec.ts',
 'renderer-validation.spec.ts',
 'shared-assets-lifecycle.spec.ts',
 'shared-image.spec.ts',
 'shared-scene-lifecycle.spec.ts',
];

// Assert macOS input semantics (navigator.platform must be Mac).
const needsMacOS=[
 'tube-loupe.spec.ts',
];

// Exact pixel comparisons against native macOS references or screenshots, or
// pixel-heavy flows that exceed the test timeout under software rendering.
const needsHardwarePixels=[
 'buffer-notches.spec.ts',
 'fragment-overflow.spec.ts',
 'gel-presentation-dpr.spec.ts',
 'native-direct-raster.spec.ts',
 'native-fragment-well.spec.ts',
 'native-gel-texture.spec.ts',
 'native-palette-values.spec.ts',
 'native-particle-component.spec.ts',
 'native-particle-raster.spec.ts',
 'native-raster-scenes.spec.ts',
 'native-ui-text.spec.ts',
 'native-well-presentation.spec.ts',
 'native-well-stroke.spec.ts',
 'ordered-mesh.spec.ts',
 'ordered-texture.spec.ts',
 'shared-band-focus-native.spec.ts',
 'shared-band-focus.spec.ts',
 'shared-buffer-native.spec.ts',
 'shared-buffer.spec.ts',
 'shared-button-native.spec.ts',
 'shared-chrome-native.spec.ts',
 'shared-controls-window.spec.ts',
 'shared-dye-native.spec.ts',
 'shared-dye.spec.ts',
 'shared-fragment-edge.spec.ts',
 'shared-gel-overlap.spec.ts',
 'shared-gel.spec.ts',
 'shared-header-native.spec.ts',
 'shared-hidden-lane.spec.ts',
 'shared-image-mips.spec.ts',
 'shared-image-native.spec.ts',
 'shared-inspector-headings-native.spec.ts',
 'shared-inspector-headings.spec.ts',
 'shared-loupe-native.spec.ts',
 'shared-menu-native.spec.ts',
 'shared-overlap-window.spec.ts',
 'shared-palette-native.spec.ts',
 'shared-populated-window.spec.ts',
 'shared-sample-native.spec.ts',
 'shared-scene.spec.ts',
 'shared-slider-native.spec.ts',
 'shared-slider.spec.ts',
 'shared-startup-window.spec.ts',
 'shared-tubes-native.spec.ts',
 'shared-view-overlap.spec.ts',
];

export const linuxCiExcludedSpecs=[...needsWebGPU,...needsMacOS,...needsHardwarePixels];
