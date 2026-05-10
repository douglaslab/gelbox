import { LAYOUT } from '../../lib/layout/layout';
import { SliderView } from '../primitives/SliderView';
import { DYE_NAMES, DYE_COLORS, DYE_MAX_MASS } from '../../lib/sim/dye';
import { linearRgbToSrgbHex } from '../../lib/sim/molecularSim';

// One dye row: name label + Style::Bar slider with dye-color fill +
// dye glyph icon at the high end. Mirrors the per-dye loop in
// SampleSettingsView.cpp lines 46-128.

const DYE_ICON_NAMES = ['Xylene', 'Cresol', 'Bromphenol', 'Orange G'] as const;

export interface DyeRowProps {
  dye:    number;            // 0..3
  mass:   number;            // current mass in ng
  onChange: (mass: number) => void;
  width?: number;
  testId?: string;
}

export function DyeRow({ dye, mass, onChange, width = LAYOUT.bufferViewSliderBarSize.x, testId }: DyeRowProps) {
  const fillColor  = linearRgbToSrgbHex(DYE_COLORS[dye] as [number, number, number]);
  const emptyColor = mixHex(fillColor, '#FFFFFF', 0.8);
  const iconPath   = `/assets/molecules/${DYE_ICON_NAMES[dye]}.png`;
  const id = testId ?? `dye-row-${dye}`;

  return (
    <div
      data-testid={id}
      data-dye-index={dye}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}
    >
      <div
        style={{
          width: 90,
          flex: '0 0 auto',
          textAlign: 'right',
          paddingRight: 8,
          color: LAYOUT.bufferViewSliderTextLabelColor,
          font: `${LAYOUT.bufferViewSliderLabelFontSize}px ${LAYOUT.bufferViewSliderLabelFont}`,
          userSelect: 'none',
        }}
      >
        {DYE_NAMES[dye]}
      </div>
      <SliderView
        testId={`${id}-slider`}
        config={{
          style: 'bar',
          valueMin: 0,
          valueMax: DYE_MAX_MASS,
          quantize: 1,
          formatValue: (v) => `${Math.round(v)} ng`,
        }}
        value={mass}
        onChange={onChange}
        iconHi={iconPath}
        iconGutter={LAYOUT.bufferViewSlidersIconGutter}
        iconSize={{ x: 26, y: 26 }}
        width={width}
        barFillColor={fillColor}
        barEmptyColor={emptyColor}
        barCornerRadius={LAYOUT.bufferViewSliderCornerRadius}
        barHeight={LAYOUT.bufferViewSliderBarSize.y}
      />
    </div>
  );
}

/** Linear interpolation between two hex colors (#rrggbb). */
function mixHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}
