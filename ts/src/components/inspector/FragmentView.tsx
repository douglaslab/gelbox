import {getFocusedFragmentIndex} from '../../lib/gel/gelState';
import { useGelDispatch, useGelState } from '../gel/GelContext';
import { LAYOUT } from '../../lib/layout/layout';
import { SliderView } from '../primitives/SliderView';
import { ColorPaletteView } from './ColorPaletteView';
import { FragmentWell } from './FragmentWell';
import styles from './FragmentView.module.css';

const SLIDER_W = LAYOUT.fragViewSlidersWidth;
const SLIDER_GAP = LAYOUT.fragViewSlidersVOffset;
const ICON_GUTTER = LAYOUT.fragViewSlidersIconGutter;
const ICON_SIZE = LAYOUT.fragViewSliderIconNotionalSize;

const SIZE_MIN = 100;
const SIZE_MAX = 14000;
const MASS_MIN = 1;
const MASS_MAX = 175;
const ASPECT_MIN = 1;
const ASPECT_MAX = 16;
const AGG_MAX_MULTIMER = 7;

function fmtBp(v: number): string  { return `${Math.round(v).toLocaleString()} bp`; }
function fmtNg(v: number): string  { return `${Math.round(v).toLocaleString()} ng`; }
function fmtAsp(v: number): string { return `${Math.round(v)} : 1`; }

/**
 * "Species" panel — the default inspector content.
 * Mirrors C++ FragmentView (`/Users/shawn/code/gelbox/src/FragmentView.cpp`).
 */
export function FragmentView() {
  const state    = useGelState();
  const dispatch = useGelDispatch();

  const lane = state.lastSampleLane ?? state.selectedLane;
  const fragIdx = getFocusedFragmentIndex(state);
  const sample = state.samples[lane];
  const fragment = sample && fragIdx !== null ? sample.fragments[fragIdx] : null;

  const headerStyle = {
    left:  `${LAYOUT.fragViewHeaderBaselinePos.x}px`,
    top:   `${LAYOUT.fragViewHeaderBaselinePos.y}px`,
    font:  `${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,
    color: LAYOUT.headFontColor,
  };

  return (
    <div className={styles.root} data-testid="fragment-view">
      <h2 className={styles.header} style={headerStyle}>
        {LAYOUT.fragViewHeaderStr}
      </h2>

      {!fragment && (
        <div className={styles.empty}>
          {sample ? 'No fragment selected' : 'No sample loaded'}
        </div>
      )}

      {fragment && (
        <>
          <div
            className={styles.well}
            style={{
              left: `${LAYOUT.fragViewWellTopLeft.x}px`,
              top:  `${LAYOUT.fragViewWellTopLeft.y}px`,
            }}
          >
            <FragmentWell fragmentIndex={fragIdx!} testId="fragment-well" />
          </div>

          <div
            className={styles.palette}
            style={{
              left: `${LAYOUT.fragViewColorsTopLeft.x}px`,
              top:  `${LAYOUT.fragViewColorsTopLeft.y}px`,
            }}
          >
            <ColorPaletteView
              testId="fragment-palette"
              value={fragment.color}
              onChange={(color) =>
                dispatch({ type: 'SET_FRAGMENT_COLOR', laneIndex: lane, index: fragIdx!, color })
              }
            />
          </div>

          <div
            className={styles.sliders}
            style={{
              left: `${LAYOUT.fragViewSlidersTopLeft.x}px`,
              top:  `${LAYOUT.fragViewSlidersTopLeft.y}px`,
              gap:  `${SLIDER_GAP - 26}px`,
              width: SLIDER_W + ICON_GUTTER * 2 + ICON_SIZE.x * 2,
            }}
          >
            <SliderView
              testId="frag-size"
              config={{
                style: 'slider',
                valueMin: SIZE_MIN,
                valueMax: SIZE_MAX,
                quantize: 100,
                formatValue: fmtBp,
              }}
              value={fragment.bases}
              onChange={(v) =>
                dispatch({ type: 'SET_FRAGMENT_BASES', laneIndex: lane, index: fragIdx!, bases: Math.round(v) })
              }
              iconLo="/assets/slider-icons/size-lo.png"
              iconHi="/assets/slider-icons/size-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-mass"
              config={{
                style: 'slider',
                valueMin: MASS_MIN,
                valueMax: MASS_MAX,
                quantize: 0,
                formatValue: fmtNg,
              }}
              value={fragment.mass}
              onChange={(mass) =>
                dispatch({ type: 'SET_FRAGMENT_MASS', laneIndex: lane, index: fragIdx!, mass })
              }
              iconLo="/assets/slider-icons/concentration-lo.png"
              iconHi="/assets/slider-icons/concentration-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-aspect"
              config={{
                style: 'slider',
                valueMin: ASPECT_MIN,
                valueMax: ASPECT_MAX,
                quantize: 1,
                formatValue: fmtAsp,
              }}
              value={fragment.aspectRatio}
              onChange={(aspectRatio) =>
                dispatch({ type: 'SET_FRAGMENT_ASPECT', laneIndex: lane, index: fragIdx!, aspectRatio })
              }
              iconLo="/assets/slider-icons/aspect-lo.png"
              iconHi="/assets/slider-icons/aspect-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-aggregate"
              config={{
                style: 'graph',
                valueMin: 1,
                valueMax: AGG_MAX_MULTIMER,
                quantize: 0.05,
                notches: [0,1],
                notchAction: 'snap',
                notchSnapDist: 8/LAYOUT.fragViewSlidersGraphHeight,
              }}
              value={0}
              onChange={() => undefined}
              graphValues={
                fragment.aggregate.length === AGG_MAX_MULTIMER
                  ? [...fragment.aggregate]
                  : aggregateToColumns(fragment.aggregate, AGG_MAX_MULTIMER)
              }
              onGraphChange={(values) =>
                dispatch({ type: 'SET_FRAGMENT_AGGREGATE', laneIndex: lane, index: fragIdx!, aggregate: values })
              }
              iconLo="/assets/slider-icons/multimer-lo.png"
              iconHi="/assets/slider-icons/multimer-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />

            <SliderView
              testId="frag-degrade"
              config={{
                style: 'slider',
                valueMin: 0,
                valueMax: 2,
                quantize: 0,
                notches: [0, 0.5, 1],
                notchAction: 'snap',
              }}
              value={fragment.degrade}
              onChange={(degrade) =>
                dispatch({ type: 'SET_FRAGMENT_DEGRADE', laneIndex: lane, index: fragIdx!, degrade })
              }
              iconLo="/assets/slider-icons/degrade-lo.png"
              iconHi="/assets/slider-icons/degrade-hi.png"
              width={SLIDER_W}
              iconSize={ICON_SIZE}
              iconGutter={ICON_GUTTER}
            />
          </div>
        </>
      )}
    </div>
  );
}

function aggregateToColumns(agg: readonly number[], n: number): number[] {
  // Native pads to the minimum number of columns without changing existing
  // weights or truncating longer imported distributions. Empty means monomer.
  const out = agg.length ? [...agg] : [1];
  while(out.length<n)out.push(0);
  return out;
}
