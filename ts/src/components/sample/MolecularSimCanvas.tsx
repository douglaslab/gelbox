import { fragmentIndexIn, sameSample } from '../../lib/gel/sampleFragRef';
import { useCallback } from 'react';
import { useGelState, useGelDispatch } from '../gel/GelContext';
import { SampleSimCanvas } from './SampleSimCanvas';

export interface MolecularSimCanvasProps {
  /** Lane whose sample is shown. Caller decides via getVisibleSampleLane. */
  laneIndex: number;
  width: number;
  height: number;
}

export function MolecularSimCanvas({ laneIndex, width, height }: MolecularSimCanvasProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const sample = state.samples[laneIndex] ?? null;

  const selectedFragment = fragmentIndexIn(state.selection, sample);

  const rolloverFragment =
    fragmentIndexIn(state.rollover, sample);

  const onHoverFragment = useCallback((fragment: number | null) => {
    if (sample && fragment !== null) {
      dispatch({ type: 'SET_ROLLOVER', ref: { sample, fragmentIndex: fragment } });
    } else if (sameSample(state.rollover?.sample, sample)) {
      dispatch({ type: 'SET_ROLLOVER', ref: null });
    }
  }, [dispatch, sample, state.rollover]);

  const onPickFragment = useCallback((fragment: number) => {
    dispatch({ type: 'SET_SELECTED', laneIndex, index: fragment });
  }, [dispatch, laneIndex]);

  return (
    <SampleSimCanvas
      sample={sample}
      width={width}
      height={height}
      seed={laneIndex * 31 + 1}
      selectedFragment={selectedFragment}
      rolloverFragment={rolloverFragment}
      onHoverFragment={onHoverFragment}
      onPickFragment={onPickFragment}
      onPickBackground={() => dispatch({ type: 'TOGGLE_SAMPLE_SETTINGS' })}
      data-testid="molecular-sim-canvas"
    />
  );
}
