import { useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { hoverLoupeReducer, initialHoverLoupe } from '../../lib/gel/hoverLoupe';
import { useGelState, useGelDispatch } from './GelContext';

export function useHoverLoupe() {
  const gel = useGelState(), gelDispatch = useGelDispatch();
  const pendingRelease = useRef<{ point: {x:number;y:number} | null } | null>(null);
  const mouseDownRefresh = useRef<{ point: {x:number;y:number} | null } | null>(null);
  const currentGel = useRef(gel); currentGel.current = gel;
  const [hover, dispatch] = useReducer(hoverLoupeReducer, undefined, initialHoverLoupe);
  useEffect(() => {
    if (hover.enabled !== gel.hoverLoupeEnabled) dispatch({ type: 'enable', value: gel.hoverLoupeEnabled });
  }, [gel.hoverLoupeEnabled]);
  const previousGel = useRef(gel);
  useLayoutEffect(() => {
    const previous = previousGel.current;
    previousGel.current = gel;
    if (previous.documentRevision !== gel.documentRevision) {
      dispatch({ type: 'replace' });
      mouseDownRefresh.current = null;
      pendingRelease.current = null;
      return;
    }
    // Selection may copy ctx/samples without calling native gelDidChange.
    const samplesChanged = previous.samples.length !== gel.samples.length ||
      gel.samples.some((sample, i) => sample !== previous.samples[i]);
    const contextChanged = previous.ctx.voltage !== gel.ctx.voltage ||
      previous.ctx.time !== gel.ctx.time || previous.ctx.wellDamage !== gel.ctx.wellDamage ||
      previous.ctx.ySpaceScale !== gel.ctx.ySpaceScale || previous.ctx.gelBuffer !== gel.ctx.gelBuffer;
    if (samplesChanged || contextChanged || previous.wellRects !== gel.wellRects) {
      // Alt-clone/right-create mutate inside native mouseDown, before the
      // collection clears rollover. React commits those edits after capture.
      dispatch(mouseDownRefresh.current
        ? { type: 'refreshDuringDown', point: mouseDownRefresh.current.point }
        : { type: 'refresh' });
    }
    mouseDownRefresh.current = null;
    // Native mouseUp runs gel edits before ViewCollection restores rollover.
    // React applies END_DRAG after the capturing pointerup listener below.
    if (pendingRelease.current && !gel.drag) {
      dispatch({ type: 'up', point: pendingRelease.current.point });
      pendingRelease.current = null;
    }
  }, [gel.samples, gel.ctx, gel.wellRects, gel.documentRevision, gel.drag]);
  useEffect(() => {
    let down = false;
    let downTimer: ReturnType<typeof setTimeout> | undefined;
    // Hit-test the actual top view, even when DOM pointer capture targets a
    // different node. A preview's frame is pickable; its wedge is not.
    const pointAt = (event: { clientX: number; clientY: number }) => {
      const overlay = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-testid="gel-overlay"]');
      if (!overlay) return null;
      const rect = overlay.getBoundingClientRect(), size = currentGel.current.gelSize;
      return { x: (event.clientX - rect.left) / rect.width * size.width, y: (event.clientY - rect.top) / rect.height * size.height };
    };
    const move = (event: PointerEvent) => {
      mouseDownRefresh.current = null;
      if (!down) dispatch({ type: 'move', point: pointAt(event) });
    };
    const start = (event: PointerEvent) => {
      down = true;
      const point = pointAt(event), persistent = !!point && (event.metaKey || event.ctrlKey);
      mouseDownRefresh.current = persistent ? null : { point };
      clearTimeout(downTimer);
      // Limit the pre-clear rollover to this discrete mouse-down operation.
      downTimer = setTimeout(() => { mouseDownRefresh.current = null; }, 0);
      dispatch({ type: 'down', persistent });
    };
    const end = (event: PointerEvent) => {
      down = false;
      mouseDownRefresh.current = null;
      const point = pointAt(event);
      if (currentGel.current.drag) pendingRelease.current = { point };
      else dispatch({ type: 'up', point });
    };
    const cancel = () => { down = false; mouseDownRefresh.current = null; pendingRelease.current = null; dispatch({ type: 'cancel' }); };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget && !down) dispatch({ type: 'move', point: null }); };
    const key = (event: KeyboardEvent) => {
      mouseDownRefresh.current = null;
      const toggle = event.type === 'keydown' && event.metaKey && event.key.toLowerCase() === 'l';
      if (toggle) { event.preventDefault(); gelDispatch({ type: 'TOGGLE_HOVER_LOUPE' }); }
      dispatch({ type: 'key', meta: event.metaKey, toggle });
    };
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerdown', start, true);
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('pointerout', leave, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('keyup', key, true);
    window.addEventListener('blur', cancel);
    return () => {
      clearTimeout(downTimer);
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerdown', start, true);
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('pointerout', leave, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('keyup', key, true);
      window.removeEventListener('blur', cancel);
    };
  }, [gelDispatch]);
  return hover.preview;
}
