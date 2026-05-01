import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../../src/lib/layout/layout';

describe('LAYOUT', () => {
  it('matches Layout.h pixel positions for the gel', () => {
    expect(LAYOUT.gelSize).toEqual({ x: 390, y: 520 });
    expect(LAYOUT.gelTopLeft).toEqual({ x: 208, y: 124 });
    expect(LAYOUT.gelDefaultLanes).toBe(7);
  });

  it('matches Layout.h pixel positions for sample and inspector', () => {
    expect(LAYOUT.sampleSize).toEqual({ x: 362, y: 520 });
    expect(LAYOUT.gelToSampleGutter).toBe(30);
    expect(LAYOUT.sampleToBraceGutter).toBe(31);
    expect(LAYOUT.braceSize).toEqual({ x: 44, y: 465 });
    expect(LAYOUT.gelSettingsSize).toEqual({ x: 303, y: 520 });
    expect(LAYOUT.sampleSettingsSize).toEqual({ x: 303, y: 520 });
    expect(LAYOUT.fragViewSize).toEqual({ x: 303, y: 520 });
  });

  it('matches Layout.h color hex codes', () => {
    expect(LAYOUT.gelMicrotubeBkgndColor).toBe('#E8F2F3');
    expect(LAYOUT.gelMicrotubeBkgndColorSelected).toBe('#A1D6FF');
    expect(LAYOUT.headFontColor).toBe('#7F94AC');
    expect(LAYOUT.uiFontColor).toBe('#777777');
    expect(LAYOUT.subheadFontColor).toBe('#000000');
    expect(LAYOUT.sliderHandleColor).toBe('#4990E2');
    expect(LAYOUT.sliderLineColor).toBe('#979797');
    expect(LAYOUT.ruleColor).toBe('#C4C4C4');
  });

  it('matches Layout.h font sizes', () => {
    expect(LAYOUT.headFontSize).toBe(24);
    expect(LAYOUT.subheadFontSize).toBe(12);
    expect(LAYOUT.uiFontSize).toBe(12);
  });

  it('matches Layout.h slider geometry', () => {
    expect(LAYOUT.sliderHandleSize).toEqual({ x: 16, y: 20 });
    expect(LAYOUT.sliderNotchRadius).toBe(2.5);
    expect(LAYOUT.btnSize).toEqual({ x: 32, y: 32 });
    expect(LAYOUT.btnGutter).toBe(16);
    expect(LAYOUT.headingGutter).toBe(25);
  });

  it('matches Layout.h window size', () => {
    expect(LAYOUT.windowSize).toEqual({ x: 1365, y: 768 });
  });
});
