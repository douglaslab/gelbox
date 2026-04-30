import { describe, it, expect } from 'vitest';
import { GEL_RENDER_TUNING, GEL_SIM_TUNING } from '../../src/data/tuning';

describe('GEL_RENDER_TUNING', () => {
  it('matches the gel-render.json live-branch values', () => {
    expect(GEL_RENDER_TUNING.overcook.scale).toEqual([5, 10]);
    expect(GEL_RENDER_TUNING.h2oDistort.faint).toBe(0.25);
    expect(GEL_RENDER_TUNING.h2oDistort.overcook).toBe(3.5);
  });
});

describe('GEL_SIM_TUNING', () => {
  it('JSON-overridden values match gel-sim.json (not C++ header defaults)', () => {
    expect(GEL_SIM_TUNING.wellToDyeHeightScale).toBe(3);
    expect(GEL_SIM_TUNING.wellToHeightScale).toBe(1.5);
    expect(GEL_SIM_TUNING.smearUpWithH2O).toBe(6);
    expect(GEL_SIM_TUNING.deltaY.curveBaseTAE).toBe(0.07);
  });
  it('shared values match C++ defaults', () => {
    expect(GEL_SIM_TUNING.sampleMassHigh).toBe(175);
    expect(GEL_SIM_TUNING.baseCountHigh).toBe(14000);
    expect(GEL_SIM_TUNING.deltaY.curveExp).toBe(3.7);
    expect(GEL_SIM_TUNING.deltaY.curveBase).toBe(0.05);
    expect(GEL_SIM_TUNING.deltaY.aspectRatioScale).toBe(0.06);
    expect(GEL_SIM_TUNING.voltageNotch).toBe(70);
    expect(GEL_SIM_TUNING.aspectRatioMax).toBe(16);
  });
  it('inline diffusion constants match GelSim.cpp', () => {
    expect(GEL_SIM_TUNING.diffusion.thresh).toBe(1500);
    expect(GEL_SIM_TUNING.diffusion.upperThresh).toBe(10000);
    expect(GEL_SIM_TUNING.diffusion.threshAmount).toBe(2);
    expect(GEL_SIM_TUNING.diffusion.tinyScale).toBe(16);
    expect(GEL_SIM_TUNING.diffusion.baseline).toBe(1);
  });
  it('flames constants give overload threshold 140 ng', () => {
    expect(GEL_SIM_TUNING.flames.overloadThreshFrac * GEL_SIM_TUNING.sampleMassHigh).toBe(140);
  });
});
