import { LAYOUT } from '../../lib/layout/layout';
import { SliderView,type SliderViewProps } from '../primitives/SliderView';
import { DYE_NAMES, DYE_COLORS, DYE_MAX_MASS } from '../../lib/sim/dye';

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
  presentation?:SliderViewProps['presentation'];
}

export function DyeRow({ dye, mass, onChange, width = LAYOUT.bufferViewSliderBarSize.x, testId,presentation }: DyeRowProps) {
  // Dye::kColors are already in the native display color domain.
  const fillColor = '#' + DYE_COLORS[dye]
    .map(channel => Math.round(channel * 255).toString(16).padStart(2, '0')).join('');
  const emptyColor = mixHex(fillColor, '#FFFFFF', 0.8);
  const iconPath   = `/assets/molecules/${DYE_ICON_NAMES[dye]}.png`;
  const id = testId ?? `dye-row-${dye}`;
  const f=Math.fround;
  const nativeFill=DYE_COLORS[dye].map(f) as [number,number,number];
  const nativeEmpty=nativeFill.map(c=>f(c+f(f(1-c)*f(.8)))) as [number,number,number];

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
      <span style={{position:'absolute',opacity:0,pointerEvents:'none'}}>{DYE_NAMES[dye]}</span>
      <SliderView
        testId={`${id}-slider`}
        nativeBar
        presentation={presentation}
        style={{marginLeft:90}}
        iconLo={`/assets/native-text/dye-label-${dye}.png`}
        barColors={{fill:[...nativeFill,1],empty:[...nativeEmpty,1],textColor:[0,0,0,1]}}
        config={{
          style: 'bar',
          valueMin: 0,
          valueMax: DYE_MAX_MASS,
          quantize: 1,
          formatValue: (v) => `${Math.round(Math.max(0,Math.min(DYE_MAX_MASS,v)))} mM`,
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
