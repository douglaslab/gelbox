import type { Dispatch } from 'react';
import { LAYOUT } from '../../lib/layout/layout';
import { SliderView } from '../primitives/SliderView';
import {
  type Buffer,
  BUFFER_H2O,
  BUFFER_TBE,
  BUFFER_TAE,
  bufferEquals,
} from '../../lib/sim/buffer';
import type { Action } from '../../lib/gel/gelState';

// Port of ~/code/gelbox/src/BufferView.cpp.
//
// Four Style::Bar sliders for Tris/Borate/Acetate/EDTA, plus a 3-button
// preset selector. The preset bar matches the buffer to one of three named
// presets; clicking a preset writes its value back through the bound
// SET_GEL_BUFFER / SET_SAMPLE_BUFFER action.

export const BUFFER_PARAM_KEYS = ['tris', 'borate', 'acetate', 'edta'] as const;
type ParamKey = typeof BUFFER_PARAM_KEYS[number];
const BUFFER_PARAM_LABELS: Record<ParamKey, string> = {
  tris:    'Tris',
  borate:  'Borate',
  acetate: 'Acetate',
  edta:    'EDTA',
};
const BUFFER_PARAM_MAX:    Record<ParamKey, number> = {
  tris:    200,
  borate:  200,
  acetate: 200,
  edta:    10,
};
const BUFFER_PARAM_ICON_PATH: Record<ParamKey, string> = {
  tris:    '/assets/molecules/Tris.png',
  borate:  '/assets/molecules/Borate.png',
  acetate: '/assets/molecules/Acetate.png',
  edta:    '/assets/molecules/EDTA.png',
};

interface Preset {
  key:   string;          // distinct key for `bufferEquals` cross-comparison
  label: string;
  buffer: Buffer;
}

// Order matches C++ kBufferPresets: { h2o, 0.5×TBE, 1×TAE }.
// (Our BUFFER_TBE constant is already 0.5× per the comment in buffer.ts.)
const PRESETS: Preset[] = [
  { key: 'H2O', label: 'H₂O',    buffer: BUFFER_H2O },
  { key: 'TBE', label: '½× TBE', buffer: BUFFER_TBE },
  { key: 'TAE', label: '1× TAE', buffer: BUFFER_TAE },
];

export interface BufferViewProps {
  /** The buffer to render + edit. */
  buffer: Buffer;
  /** Called with a new Buffer whenever a slider or preset changes the value. */
  onChange: (next: Buffer) => void;
  /** Optional dispatch — we don't currently use it; onChange is the contract. */
  dispatch?: Dispatch<Action>;
  /**
   * Top-left position of the BufferView block within its parent panel. Caller
   * passes either `LAYOUT.sampleBufferViewTopLeft` or
   * `LAYOUT.gelViewBufferViewTopLeft`.
   */
  topLeft: { x: number; y: number };
  /** Test id prefix. Default 'buffer-view'. */
  testId?: string;
}

export function BufferView({ buffer, onChange, topLeft, testId = 'buffer-view' }: BufferViewProps) {
  const slidersTop = topLeft.y + LAYOUT.bufferViewSlidersTopLeft.y;
  const slidersLeft = topLeft.x + LAYOUT.bufferViewSlidersTopLeft.x;
  const presetsTop  = topLeft.y + LAYOUT.bufferViewPresetsTopLeft.y;
  const presetsLeft = topLeft.x + LAYOUT.bufferViewPresetsTopLeft.x;
  const barW = LAYOUT.bufferViewSliderBarSize.x;
  const barH = LAYOUT.bufferViewSliderBarSize.y;

  const matched = PRESETS.findIndex((p) => bufferEquals(buffer, p.buffer));

  function setParam(key: ParamKey, value: number) {
    onChange({ ...buffer, [key]: value });
  }

  return (
    <div data-testid={testId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Preset row */}
      <div
        data-testid={`${testId}-presets`}
        style={{
          position: 'absolute',
          left:     presetsLeft,
          top:      presetsTop,
          width:    LAYOUT.bufferViewPresetsSize.x,
          height:   LAYOUT.bufferViewPresetsSize.y,
          display:  'flex',
          background: LAYOUT.bufferViewSliderEmptyColor,
          borderRadius: LAYOUT.bufferViewPresetsCornerRadius,
          overflow: 'hidden',
          pointerEvents: 'auto',
          font: `${LAYOUT.subheadFontWeight} ${LAYOUT.bufferViewPresetsFontSize}px ${LAYOUT.bufferViewPresetsFont}`,
        }}
      >
        {PRESETS.map((p, i) => {
          const selected = i === matched;
          return (
            <button
              key={p.key}
              type="button"
              data-testid={`${testId}-preset-${p.key}`}
              data-selected={selected || undefined}
              onClick={() => onChange({ ...p.buffer })}
              style={{
                flex: '1 1 0',
                background: selected ? LAYOUT.bufferViewPresetsSelectColor : 'transparent',
                color:      LAYOUT.bufferViewPresetsFontColor,
                border:     'none',
                borderRight: i < PRESETS.length - 1 ? '1px solid #C4C4C4' : 'none',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Param sliders */}
      {BUFFER_PARAM_KEYS.map((key, i) => {
        const value = buffer[key];
        const max   = BUFFER_PARAM_MAX[key];
        const top   = slidersTop + i * LAYOUT.bufferViewSliderVOffset;
        return (
          <div
            key={key}
            style={{
              position: 'absolute',
              left:  slidersLeft - 100,    // leave room for the dye-style label on the left
              top,
              width: barW + 100,
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top:  '50%',
                transform: 'translateY(-50%)',
                width: 90,
                textAlign: 'right',
                color: LAYOUT.bufferViewSliderTextLabelColor,
                font: `${LAYOUT.bufferViewSliderLabelFontSize}px ${LAYOUT.bufferViewSliderLabelFont}`,
                pointerEvents: 'none',
              }}
            >
              {BUFFER_PARAM_LABELS[key]}
            </div>
            <SliderView
              testId={`${testId}-${key}`}
              config={{
                style: 'bar',
                valueMin: 0,
                valueMax: max,
                quantize: 0.5,
                formatValue: (v) => `${v.toFixed(1)} mM`,
              }}
              value={value}
              onChange={(v) => setParam(key, v)}
              iconLo={undefined}
              iconHi={BUFFER_PARAM_ICON_PATH[key]}
              iconGutter={LAYOUT.bufferViewSlidersIconGutter}
              iconSize={{ x: 26, y: 26 }}
              width={barW}
              barFillColor={LAYOUT.bufferViewSliderFillColor}
              barEmptyColor={LAYOUT.bufferViewSliderEmptyColor}
              barCornerRadius={LAYOUT.bufferViewSliderCornerRadius}
              barHeight={barH}
              style={{ position: 'absolute', left: 100, top: 0, width: barW + 26 + LAYOUT.bufferViewSlidersIconGutter }}
            />
          </div>
        );
      })}
    </div>
  );
}
