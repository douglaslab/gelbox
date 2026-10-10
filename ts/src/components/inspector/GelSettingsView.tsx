import { LAYOUT } from '../../lib/layout/layout';
import { useGelDispatch, useGelState } from '../gel/GelContext';
import { SliderView } from '../primitives/SliderView';
import { BufferView } from './BufferView';
import {
  type Buffer,
  BUFFER_H2O,
  BUFFER_TBE,
  BUFFER_TAE,
  bufferEquals,
} from '../../lib/sim/buffer';
import styles from './FragmentView.module.css';

// Port of ~/code/gelbox/src/GelSettingsView.cpp.
//
// Native default: timeline below gel; lanes, damage, voltage, disabled rotation here.

const VOLTAGE_LOW          = -300;
const VOLTAGE_HIGH         =  300;
const VOLTAGE_DEFAULT      =   70;
const NUM_LANES_MIN        =    7;
const NUM_LANES_MAX        =   20;
const GEL_ROTATE_MAX       =   20; // degrees

const SLIDER_W = LAYOUT.fragViewSlidersWidth;
const SLIDER_GAP = LAYOUT.fragViewSlidersVOffset;
const ICON_GUTTER = LAYOUT.fragViewSlidersIconGutter;
const ICON_SIZE = LAYOUT.fragViewSliderIconNotionalSize;

export function GelSettingsView() {
  const state    = useGelState();
  const dispatch = useGelDispatch();

  const sliders = [
    {
      key: 'lanes',
      iconLo: '/assets/slider-icons/gel-lanes-lo.png',
      iconHi: '/assets/slider-icons/gel-lanes-hi.png',
      value: state.numLanes,
      cfg: {
        style: 'slider' as const,
        valueMin: NUM_LANES_MIN,
        valueMax: NUM_LANES_MAX,
        quantize: 1,
        formatValue: (v: number) => `${Math.round(v)}`,
      },
      onChange: (v: number) => dispatch({ type: 'SET_NUM_LANES', value: v }),
    },
    {
      key: 'well-damage',
      iconLo: '/assets/slider-icons/well-damage-lo.png',
      iconHi: '/assets/slider-icons/well-damage-hi.png',
      value: state.ctx.wellDamage,
      cfg: {
        style: 'slider' as const,
        valueMin: 0,
        valueMax: 1,
        quantize: 0,
      },
      onChange: (v: number) => dispatch({ type: 'SET_WELL_DAMAGE', value: v }),
    },
    {
      key: 'voltage',
      iconLo: '/assets/slider-icons/voltage-lo.png',
      iconHi: '/assets/slider-icons/voltage-hi.png',
      value: state.ctx.voltage,
      cfg: {
        style: 'slider' as const,
        valueMin: VOLTAGE_LOW,
        valueMax: VOLTAGE_HIGH,
        quantize: 1,
        notches: [
          (0 - VOLTAGE_LOW) / (VOLTAGE_HIGH - VOLTAGE_LOW),
          (VOLTAGE_DEFAULT - VOLTAGE_LOW) / (VOLTAGE_HIGH - VOLTAGE_LOW),
        ],
        notchAction: 'snap' as const,
        formatValue: (v: number) => `${Math.round(v)} V`,
      },
      onChange: (v: number) => dispatch({ type: 'SET_VOLTAGE', value: v }),
    },
    {
      key: 'rotate',
      iconLo: '/assets/slider-icons/gel-rotate-lo.png',
      iconHi: '/assets/slider-icons/gel-rotate-hi.png',
      value: state.gelRotate,
      cfg: {
        style: 'slider' as const,
        enabled: false,
        valueMin: -GEL_ROTATE_MAX,
        valueMax:  GEL_ROTATE_MAX,
        quantize: 0,
        notches: [0, 0.5, 1],
        notchAction: 'snap' as const,
      },
      onChange: (v: number) => dispatch({ type: 'SET_GEL_ROTATE', value: v }),
    },
  ];

  function setGelBuffer(b: Buffer) {
    // Match the buffer to one of three known presets and dispatch by tag.
    if (bufferEquals(b, BUFFER_TBE))      dispatch({ type: 'SET_GEL_BUFFER', value: 'TBE' });
    else if (bufferEquals(b, BUFFER_TAE)) dispatch({ type: 'SET_GEL_BUFFER', value: 'TAE' });
    else if (bufferEquals(b, BUFFER_H2O)) dispatch({ type: 'SET_GEL_BUFFER', value: 'H2O' });
    // Native defaults disable individual concentration edits; imports still
    // preserve arbitrary compositions until the user chooses a preset.
  }

  return (
    <div data-testid="gel-settings-view" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <h2
        style={{
          position: 'absolute',
          left:     `${LAYOUT.gelSettingsHeaderBaselinePos.x}px`,
          top:      `${LAYOUT.gelSettingsHeaderBaselinePos.y}px`,
          margin:   0,
          font:     `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
          color:    LAYOUT.headFontColor,
          lineHeight: 1,
        }}
      >
        {LAYOUT.gelSettingsHeaderStr}
      </h2>

      {/* Buffer panel for the GEL running buffer (presets re-used from M16). */}
      <BufferView
        buffer={state.ctx.gelBuffer}
        onChange={setGelBuffer}
        topLeft={LAYOUT.gelViewBufferViewTopLeft}
        testId="gel-buffer-view"
      />

      <div data-testid="gel-settings-rule" style={{
        position: 'absolute', left: LAYOUT.gelSettingsRuleTopLeft.x,
        top: LAYOUT.gelSettingsRuleTopLeft.y, width: LAYOUT.gelSettingsRuleLength,
        borderTop: `1px solid ${LAYOUT.ruleColor}`,
      }} />

      {/* Sliders. */}
      <div className={styles.sliders} style={{
        position: 'absolute',
        left: LAYOUT.gelSettingsSlidersTopLeft.x,
        top:  LAYOUT.gelSettingsSlidersTopLeft.y,
        width: SLIDER_W,
      }}>
        {sliders.map((s, i) => (
          <SliderView
            key={s.key}
            testId={`gel-${s.key}`}
            config={s.cfg}
            value={s.value}
            onChange={s.onChange}
            iconLo={s.iconLo}
            iconHi={s.iconHi}
            iconGutter={ICON_GUTTER}
            iconSize={ICON_SIZE}
            width={SLIDER_W}
            style={{ position: 'absolute', top: i * SLIDER_GAP, left: 0 }}
          />
        ))}
      </div>
    </div>
  );
}
