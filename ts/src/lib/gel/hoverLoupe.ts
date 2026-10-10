import type { LoupeRef } from './gelState';
import type { Point } from './loupeGeometry';
export interface HoverLoupeState {
  enabled: boolean;
  meta: boolean;
  point: Point | null;
  preview: LoupeRef | null;
}
export type HoverLoupeEvent =
  | { type: 'move' | 'up'; point: Point | null }
  | { type: 'key'; meta: boolean; toggle: boolean }
  | { type: 'enable'; value: boolean }
  | { type: 'down'; persistent: boolean }
  | { type: 'refresh' | 'replace' | 'cancel' };
export const initialHoverLoupe = (): HoverLoupeState => ({ enabled: false, meta: false, point: null, preview: null });
function refresh(state: HoverLoupeState): HoverLoupeState {
  const anchor = state.point && { x: Math.fround(state.point.x), y: Math.fround(state.point.y) };
  return { ...state, preview: anchor && (state.enabled || state.meta)
    ? { id: 0, anchor, frame: { x: Math.fround(anchor.x + 85.5), y: Math.fround(anchor.y - 85.5) } }
    : null };
}
/** GelView refreshes on move/key/gel changes; ViewCollection down/up only
 * change rollover. Keep the rendered snapshot separate to preserve that order. */
export function hoverLoupeReducer(state: HoverLoupeState, event: HoverLoupeEvent): HoverLoupeState {
  switch (event.type) {
    case 'enable': return refresh({ ...state, enabled: event.value });
    case 'move': return refresh({ ...state, point: event.point });
    case 'up': return { ...state, point: event.point };
    case 'key': return refresh({ ...state, meta: event.meta, enabled: event.toggle ? !state.enabled : state.enabled });
    case 'down': return { ...state, point: null, preview: event.persistent ? null : state.preview };
    case 'refresh': return refresh(state);
    case 'replace': return { ...state, preview: null };
    case 'cancel': return { ...state, meta: false, point: null, preview: null };
  }
}
