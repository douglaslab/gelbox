import type { Sample, Fragment } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';
import type { Rect } from '../sim/band';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../sim/buffer';
import ladder from '../../../fixtures/states/ladder-1kb.json';

export interface DragState {
  fragmentIndex: number;
  startY:        number;
  startBases:    number;
}

export interface GelState {
  sample:                Sample;
  ctx:                   SimContext;
  selectedFragmentIndex: number | null;
  fixtureKey:            string;
  modifiers:             { shift: boolean; alt: boolean; meta: boolean };
  drag:                  DragState | null;
  gelSize:               { width: number; height: number };
  pixelsPerUnit:         number;
  wellRect:              Rect;
}

export type Action =
  | { type: 'SET_VOLTAGE';        value: number }
  | { type: 'SET_TIME';           value: number }
  | { type: 'SET_WELL_DAMAGE';    value: number }
  | { type: 'SET_GEL_BUFFER';     value: 'TBE' | 'TAE' | 'H2O' }
  | { type: 'LOAD_FIXTURE';       key: string; sample: Sample }
  | { type: 'SET_SELECTED';       index: number | null }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'BEGIN_DRAG';         fragmentIndex: number; startY: number }
  | { type: 'END_DRAG' }
  | { type: 'CLONE_FRAGMENT';     sourceIndex: number }
  | { type: 'SET_FRAGMENT_BASES'; index: number; bases: number }
  | { type: 'SET_MODIFIERS';      modifiers: { shift: boolean; alt: boolean; meta: boolean } };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const BUFFER_BY_KEY = {
  TBE: BUFFER_TBE,
  TAE: BUFFER_TAE,
  H2O: BUFFER_H2O,
} as const;

export function initialGelState(): GelState {
  const sample = ladder as unknown as Sample;
  return {
    sample,
    ctx: {
      voltage: 70,
      time:    0.5,
      ySpaceScale: 200,
      wellDamage: 0,
      gelBuffer: BUFFER_TBE,
      sampleBuffer: sample.buffer,
    },
    selectedFragmentIndex: null,
    fixtureKey: 'ladder-1kb',
    modifiers: { shift: false, alt: false, meta: false },
    drag: null,
    gelSize: { width: 320, height: 240 },
    pixelsPerUnit: 1,
    wellRect: { x1: 140, y1: 8, x2: 180, y2: 18 },
  };
}

export function gelReducer(state: GelState, action: Action): GelState {
  switch (action.type) {
    case 'SET_VOLTAGE':
      return { ...state, ctx: { ...state.ctx, voltage: action.value } };
    case 'SET_TIME':
      return { ...state, ctx: { ...state.ctx, time: clamp(action.value, 0, 1) } };
    case 'SET_WELL_DAMAGE':
      return { ...state, ctx: { ...state.ctx, wellDamage: clamp(action.value, 0, 1) } };
    case 'SET_GEL_BUFFER':
      return { ...state, ctx: { ...state.ctx, gelBuffer: BUFFER_BY_KEY[action.value] } };
    case 'LOAD_FIXTURE':
      return {
        ...state,
        sample: action.sample,
        fixtureKey: action.key,
        selectedFragmentIndex: null,
        ctx: { ...state.ctx, sampleBuffer: action.sample.buffer },
        drag: null,
      };
    case 'SET_SELECTED':
      return { ...state, selectedFragmentIndex: action.index };
    case 'SELECT_NEXT': {
      const n = state.sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const next = cur === null ? 0 : (cur + 1) % n;
      return { ...state, selectedFragmentIndex: next };
    }
    case 'SELECT_PREV': {
      const n = state.sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const prev = cur === null ? n - 1 : (cur - 1 + n) % n;
      return { ...state, selectedFragmentIndex: prev };
    }
    case 'BEGIN_DRAG': {
      const frag = state.sample.fragments[action.fragmentIndex];
      if (!frag) return state;
      return {
        ...state,
        drag: { fragmentIndex: action.fragmentIndex, startY: action.startY, startBases: frag.bases },
        selectedFragmentIndex: action.fragmentIndex,
      };
    }
    case 'END_DRAG':
      return { ...state, drag: null };
    case 'CLONE_FRAGMENT': {
      const src = state.sample.fragments[action.sourceIndex];
      if (!src) return state;
      const fragments: Fragment[] = [
        ...state.sample.fragments.slice(0, action.sourceIndex + 1),
        { ...src },
        ...state.sample.fragments.slice(action.sourceIndex + 1),
      ];
      return {
        ...state,
        sample: { ...state.sample, fragments },
        selectedFragmentIndex: action.sourceIndex + 1,
      };
    }
    case 'SET_FRAGMENT_BASES': {
      const fragments = state.sample.fragments.map((f, i) =>
        i === action.index ? { ...f, bases: action.bases } : f
      );
      return { ...state, sample: { ...state.sample, fragments } };
    }
    case 'SET_MODIFIERS':
      return { ...state, modifiers: action.modifiers };
    default: {
      // exhaustiveness check
      const _: never = action;
      void _;
      return state;
    }
  }
}
