import { useRef } from 'react';
import { tubeGeometry } from '../../lib/layout/tubeGeometry';
import type { Rect } from '../../lib/sim/band';
import { sampleKeyAction } from '../../lib/gel/sampleKeyboard';
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

  const geometry = Array.from({ length: state.numLanes }, (_, i) =>
    tubeGeometry(state.gelSize.width, state.gelSize.height, state.numLanes, i));
  const rowTop = geometry[0].well.y1;
  const rectStyle = (r: Rect) => ({ left: r.x1, top: r.y1 - rowTop,
    width: r.x2 - r.x1, height: r.y2 - r.y1 });
  const pointer = useRef<{ id: number; lane: number; x: number; y: number; selected: boolean } | null>(null);

  function laneAtPoint(x: number, y: number): number {
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect || y < rect.top || y > rect.bottom || x < rect.left || x >= rect.right) return -1;
    const px = (x - rect.left) * state.gelSize.width / rect.width;
    const py = (y - rect.top) * (-rowTop) / rect.height + rowTop;
    return geometry.findIndex(({ hit }) => px >= hit.x1 && px <= hit.x2 && py >= hit.y1 && py <= hit.y2);
  }

  function onTubePointerDown(laneIndex: number, e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || pointer.current) return;
    e.preventDefault();
    pointer.current = { id: e.pointerId, lane: laneIndex, x: e.clientX, y: e.clientY,
      selected: state.lastSampleLane === laneIndex };
    rowRef.current?.setPointerCapture(e.pointerId);
    rowRef.current?.focus({ preventScroll: true });
    dispatch({ type: 'BEGIN_SAMPLE_DRAG', laneIndex, clone: e.altKey });
  }

  function endPointer(e: React.PointerEvent<HTMLDivElement>, cancel = false) {
    const down = pointer.current;
    if (!down || down.id !== e.pointerId) return;
    pointer.current = null;
    dispatch({ type: 'END_SAMPLE_DRAG' });
    if (!cancel && down.selected && state.lastSampleLane === down.lane &&
        Math.hypot(e.clientX - down.x, e.clientY - down.y) < 3) dispatch({ type: 'CLOSE_SAMPLE' });
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div className={styles.row} ref={rowRef} data-testid="microtube-row" tabIndex={-1}
      style={{ top: rowTop, height: -rowTop, outline: 'none', touchAction: 'none' }}
      onPointerMove={e => {
        if (pointer.current?.id === e.pointerId) dispatch({ type: 'UPDATE_SAMPLE_DRAG', laneIndex: laneAtPoint(e.clientX, e.clientY) });
      }}
      onPointerUp={e => endPointer(e)}
      onPointerCancel={e => endPointer(e, true)}
      onLostPointerCapture={e => endPointer(e, true)}
      onKeyDown={e => {
        const action = sampleKeyAction(e.key, e.shiftKey, state);
        if (action) { e.preventDefault(); dispatch(action); }
      }}
    >
      {Array.from({ length: state.numLanes }, (_, i) => {
        const isSelected = state.lastSampleLane === i;
        const g = geometry[i];
        const hasSample  = state.samples[i] !== null;
        return (
          <div
            className={styles.cell}
            key={i}
            data-selected={isSelected || undefined}
            data-loaded={hasSample || undefined}
          >
            <div className={styles.underlay} style={{ ...rectStyle(g.background), borderRadius: g.radius }} />
            <button
              type="button"
              aria-label={`Lane ${i + 1}${hasSample ? " sample" : " empty"}`}
              className={styles.tube}
              data-testid={`microtube-${i}`}
              data-lane-index={i}
              data-selected={isSelected || undefined}
              data-empty={!hasSample || undefined}
              onPointerDown={(e) => onTubePointerDown(i, e)}
              style={rectStyle(g.hit)}
              onClick={e => {
                // Browser keyboard activation has no pointer sequence.
                if (e.detail === 0) dispatch(state.lastSampleLane === i
                  ? { type: 'CLOSE_SAMPLE' } : { type: 'SET_SELECTED_LANE', laneIndex: i });
              }}
            >
              {hasSample && <img
                src={resolveAssetUrl('/assets/microtube1500ul.png')}
                alt={`lane ${i + 1}`}
                className={styles.icon}
                style={{ left: g.icon.x1 - g.hit.x1, top: g.icon.y1 - g.hit.y1,
                  width: g.icon.x2 - g.icon.x1, height: g.icon.y2 - g.icon.y1 }}
                data-empty={!hasSample || undefined}
                onError={dprFallbackOnError}
              />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
