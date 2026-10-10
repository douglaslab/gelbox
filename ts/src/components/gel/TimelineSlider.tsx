import { useGelDispatch, useGelState } from './GelContext';
import { SliderView } from '../primitives/SliderView';
import type { SliderConfig } from '../../lib/slider/slider';

const MAX_MINUTES = 60 * 3;

const TIMELINE_CONFIG: SliderConfig = {
  style:    'slider',
  valueMin: 0,
  valueMax: 1,
  quantize: 0,
  formatValue: (v) => {
    const mins = Math.round(v * MAX_MINUTES);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m < 10 ? '0' : ''}${m}`;
  },
};

/**
 * Timeline slider rendered below the gel rect.
 * Matches Gelbox's `kConfig.mTimelineBelowGel = true` default placement.
 */
export function TimelineSlider() {
  const state = useGelState();
  const dispatch = useGelDispatch();

  return (
    <SliderView
      config={TIMELINE_CONFIG}
      value={state.ctx.time}
      onChange={(v) => dispatch({ type: 'SET_TIME', value: v })}
      iconLo="/assets/slider-icons/clock-lo.png"
      iconHi="/assets/slider-icons/clock-hi.png"
      width={undefined as unknown as number /* let parent control width */}
      style={{ width: '100%' }}
      testId="timeline-slider"
      presentation={{viewKey:'gel',order:110}}
    />
  );
}
