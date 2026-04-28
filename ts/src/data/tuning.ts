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
