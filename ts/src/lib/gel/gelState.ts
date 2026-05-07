import type { Sample, Fragment } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';
import type { Rect } from '../sim/band';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../sim/buffer';
import type { SampleFragRef } from './sampleFragRef';
import { sampleFragRefEq } from './sampleFragRef';
import ladder from '../../../fixtures/states/ladder-1kb.json';

const NUM_LANES = 7;
const GEL_SIZE = { width: 390, height: 520 };
const WELL_Y1 = 17;   // was 8 (240-tall gel); 8 × (520/240) ≈ 17.3 → 17
const WELL_Y2 = 39;   // was 18 (240-tall gel); 18 × (520/240) = 39

export interface BandDrag {
  type:          'band';
  laneIndex:     number;
  fragmentIndex: number;
  startY:        number;
  startBases:    number;
}
export interface SampleDrag {
  type:      'sample';
  laneIndex: number;
}
export type DragState = BandDrag | SampleDrag;

export interface LoupeRef {
  id:            number;
  lane:          number;
  fragmentIndex: number;
  x:             number;   // viewport-page x in CSS px
  y:             number;   // viewport-page y in CSS px
}

export type InspectorMode = 'default' | 'gel-settings' | 'sample-settings' | 'fragment';

export interface GelState {
  samples:               (Sample | null)[];
  numLanes:              number;
  ctx:                   SimContext;
  selectedLane:          number;
  selectedFragmentIndex: number | null;
  fixtureKey:            string;
  modifiers:             { shift: boolean; alt: boolean; meta: boolean };
  drag:                  DragState | null;
  gelSize:               { width: number; height: number };
  pixelsPerUnit:         number;
  wellRects:             Rect[];
  loupes:                LoupeRef[];
  loupeNextId:           number;
  selection:             SampleFragRef | null;
  rollover:              SampleFragRef | null;
  inspectorMode:         InspectorMode;
}

export type Action =
  | { type: 'SET_VOLTAGE';        value: number }
  | { type: 'SET_TIME';           value: number }
  | { type: 'SET_WELL_DAMAGE';    value: number }
  | { type: 'SET_GEL_BUFFER';     value: 'TBE' | 'TAE' | 'H2O' }
  | { type: 'LOAD_FIXTURE';       key: string; sample: Sample; lane: number }
  | { type: 'LOAD_GEL_STATE';    samples: (Sample | null)[]; numLanes: number; ctx: SimContext }
  | { type: 'SET_SELECTED_LANE';  laneIndex: number }
  | { type: 'SET_SELECTED';       laneIndex: number; index: number | null }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'BEGIN_DRAG';         laneIndex: number; fragmentIndex: number; startY: number }
  | { type: 'END_DRAG' }
  | { type: 'BEGIN_SAMPLE_DRAG';  laneIndex: number }
  | { type: 'END_SAMPLE_DRAG' }
  | { type: 'MOVE_SAMPLE';        from: number; to: number }
  | { type: 'CLONE_SAMPLE_TO_LANE'; from: number; to: number }
  | { type: 'CLONE_FRAGMENT';     laneIndex: number; sourceIndex: number }
  | { type: 'SET_FRAGMENT_BASES'; laneIndex: number; index: number; bases: number }
  | { type: 'SET_FRAGMENT_MASS';     laneIndex: number; index: number; mass: number }
  | { type: 'SET_FRAGMENT_ASPECT';   laneIndex: number; index: number; aspectRatio: number }
  | { type: 'SET_FRAGMENT_AGGREGATE'; laneIndex: number; index: number; aggregate: number[] }
  | { type: 'SET_FRAGMENT_DEGRADE';  laneIndex: number; index: number; degrade: number }
  | { type: 'SET_FRAGMENT_COLOR';    laneIndex: number; index: number; color: [number, number, number] }
  | { type: 'SET_MODIFIERS';      modifiers: { shift: boolean; alt: boolean; meta: boolean } }
  | { type: 'ADD_LOUPE';     lane: number; fragmentIndex: number; x: number; y: number }
  | { type: 'REMOVE_LOUPE';  id: number }
  | { type: 'CLEAR_LOUPES' }
  | { type: 'SET_SELECTION'; ref: SampleFragRef | null }
  | { type: 'SET_ROLLOVER';  ref: SampleFragRef | null }
  | { type: 'SET_INSPECTOR_MODE'; mode: InspectorMode };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const BUFFER_BY_KEY = {
  TBE: BUFFER_TBE,
  TAE: BUFFER_TAE,
  H2O: BUFFER_H2O,
} as const;

function computeWellRects(numLanes: number, gelSize: { width: number; height: number }): Rect[] {
  const laneWidth = gelSize.width / numLanes;
  const wellWidth = laneWidth * 0.7;
  const out: Rect[] = [];
  for (let i = 0; i < numLanes; i++) {
    const cx = laneWidth * (i + 0.5);
    out.push({ x1: cx - wellWidth / 2, y1: WELL_Y1, x2: cx + wellWidth / 2, y2: WELL_Y2 });
  }
  return out;
}

export function initialGelState(): GelState {
  const sample = ladder as unknown as Sample;
  const samples: (Sample | null)[] = new Array(NUM_LANES).fill(null);
  samples[0] = sample;
  return {
    samples,
    numLanes: NUM_LANES,
    ctx: {
      voltage: 70,
      time:    1.0,
      ySpaceScale: 200,
      wellDamage: 0,
      gelBuffer: BUFFER_TBE,
      sampleBuffer: sample.buffer,
    },
    selectedLane: 0,
    selectedFragmentIndex: sample.fragments.length > 0 ? 0 : null,
    fixtureKey: 'ladder-1kb',
    modifiers: { shift: false, alt: false, meta: false },
    drag: null,
    gelSize: GEL_SIZE,
    pixelsPerUnit: 1,
    wellRects: computeWellRects(NUM_LANES, GEL_SIZE),
    loupes: [],
    loupeNextId: 1,
    selection: null,
    rollover:  null,
    inspectorMode: 'default',
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
    case 'LOAD_FIXTURE': {
      const samples = state.samples.slice();
      samples[action.lane] = action.sample;
      return {
        ...state,
        samples,
        fixtureKey: action.key,
        selectedLane: action.lane,
        selectedFragmentIndex: action.sample.fragments.length > 0 ? 0 : null,
        ctx: { ...state.ctx, sampleBuffer: action.sample.buffer },
        drag: null,
      };
    }
    case 'LOAD_GEL_STATE': {
      const wellRects = computeWellRects(action.numLanes, state.gelSize);
      return {
        ...state,
        samples: action.samples.slice(),
        numLanes: action.numLanes,
        ctx: action.ctx,
        wellRects,
        selectedLane: 0,
        selectedFragmentIndex: null,
        drag: null,
      };
    }
    case 'SET_SELECTED_LANE':
      return { ...state, selectedLane: action.laneIndex, selectedFragmentIndex: null };
    case 'SET_SELECTED':
      return { ...state, selectedLane: action.laneIndex, selectedFragmentIndex: action.index };
    case 'SELECT_NEXT': {
      const sample = state.samples[state.selectedLane];
      if (!sample) return state;
      const n = sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const next = cur === null ? 0 : (cur + 1) % n;
      return { ...state, selectedFragmentIndex: next };
    }
    case 'SELECT_PREV': {
      const sample = state.samples[state.selectedLane];
      if (!sample) return state;
      const n = sample.fragments.length;
      if (n === 0) return state;
      const cur = state.selectedFragmentIndex;
      const prev = cur === null ? n - 1 : (cur - 1 + n) % n;
      return { ...state, selectedFragmentIndex: prev };
    }
    case 'BEGIN_DRAG': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const frag = sample.fragments[action.fragmentIndex];
      if (!frag) return state;
      return {
        ...state,
        drag: {
          type: 'band',
          laneIndex: action.laneIndex,
          fragmentIndex: action.fragmentIndex,
          startY: action.startY,
          startBases: frag.bases,
        },
        selectedLane: action.laneIndex,
        selectedFragmentIndex: action.fragmentIndex,
      };
    }
    case 'END_DRAG':
      return { ...state, drag: null };
    case 'BEGIN_SAMPLE_DRAG':
      return { ...state, drag: { type: 'sample', laneIndex: action.laneIndex } };
    case 'END_SAMPLE_DRAG':
      return { ...state, drag: null };
    case 'MOVE_SAMPLE': {
      if (action.from === action.to) return state;
      const samples = state.samples.slice();
      const tmp = samples[action.from];
      samples[action.from] = samples[action.to];
      samples[action.to] = tmp;
      return { ...state, samples, selectedLane: action.to, drag: null };
    }
    case 'CLONE_SAMPLE_TO_LANE': {
      if (action.from === action.to) return state;
      const src = state.samples[action.from];
      if (!src) return state;
      const samples = state.samples.slice();
      samples[action.to] = { ...src, fragments: src.fragments.map((f) => ({ ...f })) };
      return { ...state, samples, selectedLane: action.to, drag: null };
    }
    case 'CLONE_FRAGMENT': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const src = sample.fragments[action.sourceIndex];
      if (!src) return state;
      const fragments: Fragment[] = [
        ...sample.fragments.slice(0, action.sourceIndex + 1),
        { ...src },
        ...sample.fragments.slice(action.sourceIndex + 1),
      ];
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return {
        ...state,
        samples,
        selectedLane: action.laneIndex,
        selectedFragmentIndex: action.sourceIndex + 1,
      };
    }
    case 'SET_FRAGMENT_BASES': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, bases: action.bases } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_MASS': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, mass: action.mass } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_ASPECT': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, aspectRatio: action.aspectRatio } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_AGGREGATE': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, aggregate: action.aggregate.slice() } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_DEGRADE': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, degrade: action.degrade } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_COLOR': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, color: action.color } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = { ...sample, fragments };
      return { ...state, samples };
    }
    case 'SET_MODIFIERS':
      return { ...state, modifiers: action.modifiers };
    case 'ADD_LOUPE': {
      const sample = state.samples[action.lane];
      if (!sample || !sample.fragments[action.fragmentIndex]) return state;
      const id = state.loupeNextId;
      return {
        ...state,
        loupes: [...state.loupes, { id, lane: action.lane, fragmentIndex: action.fragmentIndex, x: action.x, y: action.y }],
        loupeNextId: id + 1,
      };
    }
    case 'REMOVE_LOUPE':
      return { ...state, loupes: state.loupes.filter((l) => l.id !== action.id) };
    case 'CLEAR_LOUPES':
      return { ...state, loupes: [], loupeNextId: 1 };
    case 'SET_SELECTION':
      if (sampleFragRefEq(state.selection, action.ref)) return state;
      return { ...state, selection: action.ref };
    case 'SET_ROLLOVER':
      if (sampleFragRefEq(state.rollover, action.ref)) return state;
      return { ...state, rollover: action.ref };
    case 'SET_INSPECTOR_MODE':
      if (state.inspectorMode === action.mode) return state;
      return { ...state, inspectorMode: action.mode };
    default: {
      const _: never = action;
      void _;
      return state;
    }
  }
}
