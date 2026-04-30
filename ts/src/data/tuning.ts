// Port of ~/code/gelbox/assets/tuning/gel-render.json (live "Older" overcook branch only).
// Frozen const — these are calibration values, read-only at runtime.
export const GEL_RENDER_TUNING = {
  overcook: {
    scale: [5, 10] as readonly [number, number],
  },
  h2oDistort: {
    faint:    0.25,
    overcook: 3.5,
  },
} as const;

// Port of ~/code/gelbox/assets/tuning/gel-sim.json (loaded at runtime in C++,
// constants here). NOTE: several values in JSON differ from the C++ header
// defaults — use the JSON values. See M5 plan "Reference: C++ vs JSON" table.
export const GEL_SIM_TUNING = {
  sampleMassHigh:        175,
  baseCountHigh:         14000,
  wellToDyeHeightScale:  3,        // JSON: 3 (C++ default: 4)
  wellToHeightScale:     1.5,      // JSON: 1.5 (C++ default: 2)
  smearUpWithH2O:        6,        // JSON: 6 (C++ default: 2)
  smearUpWithWellDamage:           5,    // unused — wellDamage smear is disabled in C++
  smearUpWithWellDamageThreshold:  0.5,  // unused
  deltaY: {
    curveExp:         3.7,
    curveBase:        0.05,
    curveBaseTAE:     0.07,        // JSON: 0.07 (C++ default: 0.055)
    aspectRatioScale: 0.06,
  },
  voltageNotch:        70,         // gTuning.mSliderVoltageDefaultValue
  aspectRatioMax:      16,         // gTuning.mSliderAspectRatioMax
  // Inline constants from GelSim.cpp (NOT in JSON):
  diffusion: {
    thresh:        1500,
    upperThresh:   10000,
    threshAmount:  2,
    tinyScale:     16,
    baseline:      1,
  },
  flames: {
    overloadThreshFrac: 0.8,       // overloadThresh = sampleMassHigh * 0.8 = 140
    maxScale:           2,         // 2× rect height when at maximum overload
  },
} as const;
