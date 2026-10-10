import {useState, type Dispatch} from 'react';
import {resolveAssetUrl} from '../../lib/layout/assets';
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
  { key: 'H2O', label: 'H2O',    buffer: BUFFER_H2O },
  { key: 'TBE', label: '.5x TBE', buffer: BUFFER_TBE },
  { key: 'TAE', label: '1x TAE', buffer: BUFFER_TAE },
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
  const [notchPreset,setNotchPreset]=useState(matched);
  // Native syncPresetToModel replaces notches only when a preset matches.
  if(matched!==-1&&matched!==notchPreset)setNotchPreset(matched);

  function setParam(key: ParamKey, value: number) {
    onChange({ ...buffer, [key]: value });
  }

  return (
    <div data-testid={testId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <h3 style={{ position: 'absolute', margin: 0,
        left: presetsLeft - 100, width: 100 - LAYOUT.bufferViewSlidersIconGutter,
        top: presetsTop + 5, textAlign: 'right', lineHeight: 1,
        color: LAYOUT.subheadFontColor,
        font: `${LAYOUT.subheadFontWeight} ${LAYOUT.subheadFontSize}px ${LAYOUT.subheadFont}`,
      }}>Buffer</h3>
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
          background: '#FFFFFF',
          border: `1px solid ${LAYOUT.bufferViewPresetsColor}`,
          boxSizing: 'border-box',
          borderRadius: LAYOUT.bufferViewPresetsCornerRadius,
          overflow: 'hidden',
          pointerEvents: 'auto',
          font: `${LAYOUT.uiFontWeight} ${LAYOUT.bufferViewPresetsFontSize}px ${LAYOUT.bufferViewPresetsFont}`,
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
                borderRight: i < PRESETS.length - 1 ? `1px solid ${LAYOUT.bufferViewPresetsColor}` : 'none',
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
              height: barH,
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top:  '50%',
                transform: 'translateY(-50%)',
                width: 100 - LAYOUT.bufferViewSlidersIconGutter,
                filter: 'brightness(0.85) opacity(0.5)',
                textAlign: 'right',
                color: LAYOUT.bufferViewSliderTextLabelColor,
                font: `500 ${LAYOUT.bufferViewSliderLabelFontSize}px ${LAYOUT.bufferViewSliderLabelFont}`,
                pointerEvents: 'none',
              }}
            >
              {BUFFER_PARAM_LABELS[key]}
            </div>
            <SliderView
              testId={`${testId}-${key}`}
              config={{
                style: 'bar',
                enabled: false,
                valueMin: 0,
                valueMax: max,
                quantize: 0.5,
                formatValue: (v) => `${v.toFixed(1)} mM`,
              }}
              value={value}
              onChange={(v) => setParam(key, v)}
              width={barW}
              barFillColor={LAYOUT.bufferViewSliderFillColor}
              barEmptyColor={LAYOUT.bufferViewSliderEmptyColor}
              barCornerRadius={LAYOUT.bufferViewSliderCornerRadius}
              barHeight={barH}
              style={{ position: 'absolute', left: 100, top: 0 }}
            />
            {notchPreset!==-1&&<div data-testid={`${testId}-${key}-notch`}
              style={{position:'absolute',left:100+Math.round(PRESETS[notchPreset].buffer[key]/max*barW)-1,
                top:0,width:1,height:barH,pointerEvents:'none',opacity:.5,
                background:`color-mix(in srgb, ${LAYOUT.bufferViewSliderFillColor} 80%, black)`}}/>}
            {/* Native layoutFromBar anchors the bar, then fits the natural
                28×26 molecule asset beside it; no notional icon slot. */}
            <img src={resolveAssetUrl(BUFFER_PARAM_ICON_PATH[key])} alt=""
              data-testid={`${testId}-${key}-icon-hi`} draggable={false}
              style={{position:'absolute',left:100+barW+LAYOUT.bufferViewSlidersIconGutter,
                top:-Math.round((26-barH)/2),width:28,height:26,maxWidth:'none',
                filter:'brightness(0.85) opacity(0.5)'}}/>
          </div>
        );
      })}
    </div>
  );
}
