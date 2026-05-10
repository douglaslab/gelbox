import { useCallback, useEffect, useRef } from 'react';
import { useGelState, useGelDispatch } from './GelContext';
import { resolveAssetUrl, dprFallbackOnError } from '../../lib/layout/assets';
import styles from './MicrotubeRow.module.css';

/**
 * Per-lane microtube row above the gel canvas. Each tube is a rounded
 * background rect with the microtube1500ul.png icon centered inside.
 * Background follows LAYOUT.gelMicrotubeBkgndColor / gelMicrotubeBkgndColorSelected.
 */
export function MicrotubeRow() {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const rowRef = useRef<HTMLDivElement>(null);

  const laneAtClientX = useCallback((clientX: number): number => {
    if (!rowRef.current) return state.selectedLane;
    const rect = rowRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const idx = Math.floor(x * state.numLanes);
    return Math.max(0, Math.min(state.numLanes - 1, idx));
  }, [state.numLanes, state.selectedLane]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!state.drag || state.drag.type !== 'sample') return;
    const targetLane = laneAtClientX(e.clientX);
    if (targetLane === state.drag.laneIndex) {
      dispatch({ type: 'END_SAMPLE_DRAG' });
      return;
    }
    if (e.altKey) {
      dispatch({ type: 'CLONE_SAMPLE_TO_LANE', from: state.drag.laneIndex, to: targetLane });
    } else {
      dispatch({ type: 'MOVE_SAMPLE', from: state.drag.laneIndex, to: targetLane });
    }
  }, [state.drag, laneAtClientX, dispatch]);

  useEffect(() => {
    if (!state.drag || state.drag.type !== 'sample') return;
    window.addEventListener('pointerup', onPointerUp);
    return () => { window.removeEventListener('pointerup', onPointerUp); };
  }, [state.drag, onPointerUp]);

  function onTubePointerDown(laneIndex: number, e: React.PointerEvent<HTMLButtonElement>) {
    if (state.samples[laneIndex] === null) {
      dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
      return;
    }
    e.preventDefault();
    dispatch({ type: 'BEGIN_SAMPLE_DRAG', laneIndex });
  }

  function onTubeClick(laneIndex: number) {
    dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
  }

  return (
    <div className={styles.row} ref={rowRef} data-testid="microtube-row">
      {Array.from({ length: state.numLanes }, (_, i) => {
        const isSelected = state.selectedLane === i;
        const hasSample  = state.samples[i] !== null;
        const dragging   = state.drag?.type === 'sample' && state.drag.laneIndex === i;
        return (
          <div
            className={styles.cell}
            key={i}
            data-selected={isSelected || undefined}
            data-loaded={hasSample || undefined}
          >
            <div className={styles.underlay} />
            <button
              type="button"
              className={styles.tube}
              data-testid={`microtube-${i}`}
              data-lane-index={i}
              data-selected={isSelected || undefined}
              data-empty={!hasSample || undefined}
              data-dragging={dragging || undefined}
              onPointerDown={(e) => onTubePointerDown(i, e)}
              onClick={() => onTubeClick(i)}
            >
              <img
                src={resolveAssetUrl('/assets/microtube1500ul.png')}
                alt={`lane ${i + 1}`}
                className={styles.icon}
                data-empty={!hasSample || undefined}
                onError={dprFallbackOnError}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
