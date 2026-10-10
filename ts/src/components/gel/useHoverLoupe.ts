import {useEffect} from 'react';
import {useGelStore,useGelSnapshot} from './GelContext';
export function useHoverLoupe() {
  const store=useGelStore(),snapshot=useGelSnapshot();
  const dispatch=store.hoverEvent;
  useEffect(() => {
    let down = false;
    let downTimer:ReturnType<typeof setTimeout>|undefined;
    // Hit-test the actual top view, even when DOM pointer capture targets a
    // different node. A preview's frame is pickable; its wedge is not.
    const pointAt = (event: { clientX: number; clientY: number }) => {
      const overlay = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-testid="gel-overlay"]');
      if (!overlay) return null;
      const rect = overlay.getBoundingClientRect(), size = store.getSnapshot().gel.gelSize;
      return { x: (event.clientX - rect.left) / rect.width * size.width, y: (event.clientY - rect.top) / rect.height * size.height };
    };
    const move = (event: PointerEvent) => {
      store.endPointerDown();
      if (!down) dispatch({ type: 'move', point: pointAt(event) });
    };
    const start = (event: PointerEvent) => {
      down = true;
      const point = pointAt(event), persistent = !!point && (event.metaKey || event.ctrlKey);
      store.beginPointerDown(point,persistent);
      clearTimeout(downTimer);
      // Microtasks can run between native capture and React target listeners.
      downTimer=setTimeout(store.endPointerDown,0);
    };
    const end = (event: PointerEvent) => {
      down = false;
      store.endPointerDown();
      const point = pointAt(event);
      store.releasePointer(point);
    };
    const cancel = () => { down = false; store.endPointerDown(); store.releasePointer(null); dispatch({ type: 'cancel' }); };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget && !down) dispatch({ type: 'move', point: null }); };
    const key = (event: KeyboardEvent) => {
      store.endPointerDown();
      const toggle = event.type === 'keydown' && event.metaKey && event.key.toLowerCase() === 'l';
      if (toggle) event.preventDefault();
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
  }, [store,dispatch]);
  return snapshot.hover.preview;
}
