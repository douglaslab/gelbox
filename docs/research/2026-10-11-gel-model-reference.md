# Reference-driven model follow-up

Requested by Shawn during Windows release preparation, 2026-10-11.
Use the examples in Thermo Fisher's [Eight Tips to Improve Gel Electrophoresis Results](https://www.thermofisher.com/us/en/home/brands/thermo-scientific/molecular-biology/molecular-biology-learning-center/molecular-biology-resource-library/spotlight-articles/8-DNA-ladder-tips.html)
as reference cases for conditions Gelbox already controls. Research/design only;
no simulation behavior has been changed for this request.

Priorities from Shawn:

- Compare TAE and TBE across fragment sizes, not merely an overall speed offset.
- Reproduce the sample-quantity progression in tip 5: low loads can be flat,
  higher loads can develop curling/flames, and migration also changes.
- Account for each example on the page; distinguish unsupported controls from
  existing controls with inaccurate or missing effects.

## Current implementation

`src/GelSim.cpp::calcDeltaY` selects a different additive curve base only when
the gel buffer equals the exact TAE preset. There is no continuous buffer/size
interaction calibrated to measured separation. Fragment mass is not an input
to this migration calculation.

`fragToBand` sets curl amplitude to 35% of band height after a ten-minute ramp.
Only voltage polarity, not magnitude, affects this curl term. Thus ordinary
low-load bands curl after ten minutes too.

`calcFlames` has a threshold at 80% of `SampleMassHigh`; below that threshold,
flames are already zero. Review this threshold against the reference series
alongside the independent curl term and mass-dependent migration.

## Evidence cautions

The article's tip 3 caption conflicts with the TAE/TBE recommendations in its
body. Tip 4's caption likewise conflicts with the dye ordering described in
the body. Verify against manufacturer buffer/dye documentation before fitting.
Tip 7 describes across-lane smiling; Gelbox currently curls each band within
its own lane. Treat these as distinct effects.

Do not infer quantitative loading thresholds or migration coefficients from an
illustrative image without recording its labeled conditions and uncertainty.
A useful acceptance fixture varies one control at a time and records band
position, width, brightness and distortion separately. Shared fixtures should
be rerun on native Mac/Windows, and a separate web implementation would need
its own synchronized model changes and verification.
