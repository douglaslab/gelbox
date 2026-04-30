import { useCallback, useEffect, useRef } from 'react';
import { useGelState, useGelDispatch } from './GelContext';

const MICROTUBE_Y = 12;            // SVG-y of microtube center (above the canvas via negative)
const MICROTUBE_R = 10;            // radius

interface MicrotubeRowProps {
  // Width / height of the gel canvas in CSS pixels (matches GelCanvas). The
  // SVG viewBox spans [-extra, ..., gelWidth, ..., gelHeight + extra] but for
  // M6b we render only the row above the canvas — height = 2*MICROTUBE_Y.
}

export function MicrotubeRow(_props: MicrotubeRowProps) {
  const state = useGelState();
  const dispatch = useGelDispatch();
  const svgRef = useRef<SVGSVGElement>(null);
  const rowHeight = MICROTUBE_Y * 2 + MICROTUBE_R + 4;

  const laneAtClientX = useCallback((clientX: number): number => {
    if (!svgRef.current) return state.selectedLane;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * state.gelSize.width;
    const idx = Math.floor(x / (state.gelSize.width / state.numLanes));
    return Math.max(0, Math.min(state.numLanes - 1, idx));
  }, [state.gelSize.width, state.numLanes, state.selectedLane]);

  const onPointerMove = useCallback((_e: PointerEvent) => {
    // No live preview in M6b; just hold drag state until release
  }, []);

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
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [state.drag, onPointerMove, onPointerUp]);

  function onMicrotubePointerDown(laneIndex: number, e: React.PointerEvent<SVGCircleElement>) {
    if (state.samples[laneIndex] === null) {
      // Empty lane: just select it, don't start drag
      dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
      return;
    }
    e.preventDefault();
    dispatch({ type: 'BEGIN_SAMPLE_DRAG', laneIndex });
  }

  function onMicrotubeClick(laneIndex: number) {
    // Without movement (mouseUp == mouseDown lane), the BEGIN_SAMPLE_DRAG → END_SAMPLE_DRAG path runs.
    // This handler is mostly for empty-lane selection.
    dispatch({ type: 'SET_SELECTED_LANE', laneIndex });
  }

  const laneWidth = state.gelSize.width / state.numLanes;

  return (
    <svg
      data-testid="microtube-row"
      ref={svgRef}
      viewBox={`0 0 ${state.gelSize.width} ${rowHeight}`}
      style={{
        width:  `${state.gelSize.width  * state.pixelsPerUnit}px`,
        height: `${rowHeight * state.pixelsPerUnit}px`,
        display: 'block',
      }}
    >
      {Array.from({ length: state.numLanes }, (_, i) => {
        const cx = laneWidth * (i + 0.5);
        const isSelected = state.selectedLane === i;
        const hasSample = state.samples[i] !== null;
        const dragging = state.drag?.type === 'sample' && state.drag.laneIndex === i;
        return (
          <g key={i}>
            {isSelected && (
              <rect
                x={i * laneWidth} y={0} width={laneWidth} height={rowHeight}
                fill="var(--color-surface-raised, rgba(80,80,150,0.2))"
              />
            )}
            <circle
              data-testid={`microtube-${i}`}
              data-lane-index={i}
              cx={cx} cy={MICROTUBE_Y}
              r={MICROTUBE_R}
              fill={hasSample ? 'var(--color-accent, #88aaff)' : 'transparent'}
              stroke={hasSample ? '#fff' : 'var(--color-ink-muted, #888)'}
              strokeWidth={1}
              opacity={dragging ? 0.5 : 1}
              style={{ cursor: hasSample ? 'grab' : 'pointer' }}
              onPointerDown={(e) => onMicrotubePointerDown(i, e)}
              onClick={() => onMicrotubeClick(i)}
            />
            <text
              x={cx} y={MICROTUBE_Y + 3}
              textAnchor="middle"
              fontSize={9}
              fill={hasSample ? '#fff' : 'var(--color-ink-muted, #888)'}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
