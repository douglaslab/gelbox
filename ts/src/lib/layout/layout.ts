export interface Vec2 { x: number; y: number }

export const LAYOUT = {
  // main view
  windowSize:        { x: 1365, y: 768 } as Vec2,

  // gel
  gelSize:           { x: 390, y: 520 } as Vec2,
  gelTopLeft:        { x: 208, y: 124 } as Vec2,
  gelTopLeftMin:     { x: 8,   y: 64  } as Vec2,
  gelDefaultLanes:   7,
  gelWellGutter:     20,
  gelMicrotubeBkgndCornerRadius:        20,
  gelMicrotubeBkgndTopInsetFromIcon:    16,
  gelMicrotubeBkgndColor:               '#E8F2F3',
  gelMicrotubeBkgndColorSelected:       '#A1D6FF',
  gelMicrotubeIconToGelGutter:          6,
  gelMicrotubeWellPadding:              4,
  gelMicrotubeIconPadding:              10,

  loupeSize:         { x: 171, y: 171 } as Vec2,
  sampleSize:        { x: 362, y: 520 } as Vec2,

  gelToSampleGutter:   30,
  gelToBraceGutter:    30,
  sampleToBraceGutter: 31,

  ruleColor:           '#C4C4C4',
  headingGutter:       25,

  // app settings
  appSettingsToFirstWidgetGutter: 32,
  appSettingsToDivLine:           { x: 4, y: 10 } as Vec2,
  appSettingsItemVOffset:         28,

  checkboxSize:           { x: 16, y: 16 } as Vec2,
  checkboxToLabelGutter:  5,
  checkboxColor:          '#979797',

  appSettingsButtonColor:        'rgba(204,204,204,1)',
  appSettingsButtonCornerRadius: 2,

  // gel settings view
  gelSettingsSize:               { x: 303, y: 520 } as Vec2,
  gelSettingsSlidersTopLeft:     { x: 84,  y: 246 } as Vec2,
  gelSettingsRuleTopLeft:        { x: 66,  y: 216.5 } as Vec2,
  gelSettingsRuleLength:         237,
  // C++ used y:-25 for header baselines, putting the 24px-tall heading text
  // ~1px above each panel. Bump to -36 for breathing room in the browser.
  gelSettingsHeaderBaselinePos:  { x: 76,  y: -36 } as Vec2,
  gelSettingsHeaderStr:          'Gel',
  gelViewBufferViewTopLeft:      { x: 61,  y: 15 } as Vec2,
  gelSettingsBtnRightOfGel:      false,

  // sample settings view (positions include sampleSettingsContentOffset = (8, 0))
  sampleSettingsContentOffset:   { x: 8, y: 0 } as Vec2,
  sampleSettingsSize:            { x: 303, y: 520 } as Vec2,
  sampleSettingsSlidersTopLeft:  { x: 131 + 8, y: 336 } as Vec2,
  sampleSettingsRuleTopLeft:     { x: 59 + 8,  y: 269.5 } as Vec2,
  sampleSettingsRuleLength:      237,
  sampleBufferViewTopLeft:       { x: 65 + 8,  y: 65 } as Vec2,
  sampleSettingsSlidersToDyeLabel: 16,
  sampleSettingsSliderVOffset:    31,
  sampleSettingsHeaderBaselinePos: { x: 84 + 8, y: -36 } as Vec2,
  sampleSettingsHeaderStr:        'Buffer + Dyes',

  // sample view
  molecularSimBkgndColor:         '#F1F1F2',
  sampleViewMicrotubeBkgndGutter: 11,
  sampleViewMicrotubeBkgndRadius: 20,
  sampleViewMicrotubeWidth:       19,
  sampleViewMicrotubeGutter:      25,
  sampleViewHeaderBaselinePos:    { x: 51, y: -36 } as Vec2,
  sampleViewHeaderStr:            'Sample',
  sampleViewFragSelectColor:      '#000000',
  sampleViewFragHoverColor:       '#FFFF00',
  // C++ used 4f in Cinder's anti-aliased GL strokes which rendered visually
  // thinner; SVG strokes are crisper, so 1.5px reads about right against
  // the original screenshot.
  sampleViewFragOutlineWidth:     1.5,

  // buffer view
  bufferViewSize:                 { x: 303, y: 180 } as Vec2,
  bufferViewSlidersTopLeft:       { x: 66, y: 41 } as Vec2,
  bufferViewSliderVOffset:        31,
  bufferViewSliderBarSize:        { x: 135, y: 23 } as Vec2,
  bufferViewSlidersIconGutter:    13,
  bufferViewSliderEmptyColor:     '#E8EBF1',
  bufferViewSliderFillColor:      '#AEB6C3',
  bufferViewSliderTextLabelColor: '#777777',
  bufferViewSliderTextValueColor: '#333333',
  bufferViewSliderCornerRadius:   4,
  bufferViewSliderLabelFont:      'Inter',
  bufferViewSliderLabelFontSize:  12,
  bufferViewPresetsTopLeft:       { x: 66, y: 0 } as Vec2,
  bufferViewPresetsSize:          { x: 135, y: 23 } as Vec2,
  bufferViewPresetsCornerRadius:  5,
  bufferViewPresetsColor:         '#979797',
  bufferViewPresetsFont:          'Inter',
  bufferViewPresetsFontSize:      12,
  bufferViewPresetsFontColor:     '#2B2B2B',
  bufferViewPresetsSelectColor:   '#FFDC73',

  // shared text styles (Avenir → Inter; Heavy → 700, Medium → 500)
  subheadFont:        'Inter',
  subheadFontWeight:  500,
  subheadFontSize:    12,
  subheadFontColor:   '#000000',

  headFont:           'Inter',
  headFontWeight:     700,
  headFontSize:       24,
  headFontColor:      '#7F94AC',

  uiFont:             'Inter',
  uiFontWeight:       500,
  uiFontSize:         12,
  uiFontColor:        '#777777',

  // fragment view
  fragViewSize:                  { x: 303, y: 520 } as Vec2,
  fragViewSlidersTopLeft:        { x: 63, y: 190 } as Vec2,
  fragViewSlidersWidth:          217,
  fragViewSlidersIconGutter:     16,
  fragViewSlidersGraphHeight:    32,
  fragViewSlidersVOffset:        56,
  fragViewSliderIconNotionalSize: { x: 26, y: 26 } as Vec2,
  fragViewColorsTopLeft:         { x: 173, y: 74 } as Vec2,
  fragViewColorSize:             { x: 25, y: 25 } as Vec2,
  fragViewColorsNumCols:         4,
  fragViewHeaderBaselinePos:     { x: 77, y: -36 } as Vec2,
  fragViewHeaderStr:             'Species',
  fragViewWellTopLeft:           { x: 77, y: 71 } as Vec2,
  fragViewWellSize:              { x: 80, y: 80 } as Vec2,
  fragViewWellCornerRadius:      4,
  fragViewWellStroke:            '#BDBDBD',
  fragViewWellFill:              '#F1F1F1',
  fragViewWellShadow:            '#F0F0F0',
  fragViewWellShadowOffset:      { x: 0, y: 4 } as Vec2,

  // buttons
  btnSize:        { x: 32, y: 32 } as Vec2,
  btnHoverColor:  '#E5E5E5',
  btnDownColor:   '#B3B3B3',
  btnGutter:      16,

  // sliders
  sliderLineColor:    '#979797',
  sliderHandleColor:  '#4990E2',
  sliderHandleSize:   { x: 16, y: 20 } as Vec2,
  sliderNotchRadius:  2.5,

  // misc
  braceSize:      { x: 44, y: 465 } as Vec2,

  // debug
  debugDrawLayoutGuides:     false,
  debugDrawLayoutGuideColor: '#18BFFF',
} as const;

export type Layout = typeof LAYOUT;
