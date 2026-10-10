import {useState,useRef, type Dispatch} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {BufferPresetPaint} from './BufferPresetPaint';
import { LAYOUT } from '../../lib/layout/layout';
import { SliderView,type SliderViewProps } from '../primitives/SliderView';
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
  presentation?:SliderViewProps['presentation'];
}

export function BufferView({ buffer, onChange, topLeft, testId = 'buffer-view',presentation }: BufferViewProps) {
  const element=useRef<HTMLDivElement>(null),registry=useSharedPresentation(),shared=Boolean(registry&&presentation);
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
    <div ref={element} data-testid={testId} style={{ position: 'absolute', inset: 0, pointerEvents: 'none',opacity:shared?0:undefined }}>
      {shared&&presentation&&<BufferPresetPaint element={element} viewKey={presentation.viewKey} order={presentation.order} selected={matched} topLeft={topLeft}/>}
      <h3 style={{ position: 'absolute', margin: 0,
        left: presetsLeft - 100, width: 100 - LAYOUT.bufferViewSlidersIconGutter,
        top: presetsTop + 5, textAlign: 'right', lineHeight: 1,
        color: LAYOUT.subheadFontColor,
        font: `${LAYOUT.subheadFontWeight} ${LAYOUT.subheadFontSize}px ${LAYOUT.subheadFont}`,
      }}>Buffer</h3>
      {/* Preset row */}
      <div
        data-testid={`${testId}-presets`}
        onContextMenu={event=>event.preventDefault()}
        onPointerDown={event=>{
          // BufferView::mouseDown picks the inset native rectangle immediately;
          // it does not filter mouse buttons or wait for mouse-up.
          const r=event.currentTarget.getBoundingClientRect();
          const x=event.clientX-r.left,y=event.clientY-r.top;
          if(x<.5||x>r.width-.5||y<.5||y>r.height-.5)return;
          const index=Math.max(0,Math.min(2,Math.trunc((x-.5)/(r.width-1)*3)));
          onChange({...PRESETS[index].buffer});
        }}
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
              onClick={event => {if(event.detail===0)onChange({ ...p.buffer });}}
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
            <span style={{position:'absolute',opacity:0,pointerEvents:'none'}}>{BUFFER_PARAM_LABELS[key]}</span>
            <SliderView
              testId={`${testId}-${key}`}
              nativeBar
              presentation={presentation?{...presentation,order:presentation.order+1+i}:undefined}
              iconLo={`/assets/native-text/buffer-label-${i}.png`}
              iconHi={BUFFER_PARAM_ICON_PATH[key]}
              iconGutter={LAYOUT.bufferViewSlidersIconGutter}
              config={{
                style: 'bar',
                enabled: false,
                valueMin: 0,
                valueMax: max,
                quantize: 0.5,
                notches:notchPreset===-1?[]:[PRESETS[notchPreset].buffer[key]/max],
                notchAction:'snap',
                formatValue: (v) => `${bufferValueLabel(v,max)} mM`,
              }}
              value={Math.fround(value)}
              onChange={(v) => setParam(key, v)}
              width={barW}
              barFillColor={LAYOUT.bufferViewSliderFillColor}
              barEmptyColor={LAYOUT.bufferViewSliderEmptyColor}
              barCornerRadius={LAYOUT.bufferViewSliderCornerRadius}
              barHeight={barH}
              style={{ position: 'absolute', left: 100, top: 0 }}
            />

          </div>
        );
      })}
    </div>
  );
}

/** Slider maps back through float32 and quantizes before formatting its label. */
function bufferValueLabel(value:number,max:number):string {
 const f=Math.fround,mapped=f(f(f(value)/max)*max),steps=f(mapped/.5);
 const rounded=Math.sign(steps)*Math.floor(Math.abs(steps)+.5)*.5;
 return Math.max(0,Math.min(max,rounded)).toFixed(1);
}
