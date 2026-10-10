import { solveBasesForY } from '../sim/solver';
import { GEL_SIM_TUNING } from '../../data/tuning';
import type { Sample, Fragment } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';
import type { Rect } from '../sim/band';
import type { Buffer } from '../sim/buffer';
import { BUFFER_TBE, BUFFER_TAE, BUFFER_H2O } from '../sim/buffer';
import { DYE_COLORS, DYE_MAX_MASS, DYE_BP_LO } from '../sim/dye';
import type { SampleFragRef } from './sampleFragRef';
import { sampleFragRefEq, copySample, sameSample, reviseSample, refreshSampleRef, fragmentIndexIn } from './sampleFragRef';
import ladder from '../../../fixtures/states/ladder-1kb.json';

const NUM_LANES = 7;
const GEL_SIZE = { width: 390, height: 520 };
const Y_MARGIN = 20;  // matches Layout::mGelWellGutter

// C++ Gel::getSampleDeltaYSpaceScale() = mSize.y - mYMargin*2 - mLaneWidth*0.2
function computeYSpaceScale(width: number, height: number, numLanes: number, yMargin: number): number {
  const laneWidth = width / numLanes;
  return height - yMargin * 2 - laneWidth * 0.2;
}

export interface BandDrag {
  type:          'band';
  laneIndex:     number;
  fragmentIndex: number;
  startY:        number;
  referenceY:    number;
  aggregate:     number;
  startBases:    number;
  temporaryLane: number | null;
}
export interface SampleDrag {
  type:      'sample';
  laneIndex: number;
  sample: Sample;
}
export type DragState = BandDrag | SampleDrag;

export interface LoupeRef {
  id:     number;
  anchor: { x: number; y: number };   // gel-space pixels (for synthetic-sample extraction)
  frame: { x: number; y: number };    // top-left in gel-local pixels
}

export type InspectorMode = 'default' | 'gel-settings' | 'sample-settings' | 'fragment';

export interface GelState {
  /** Transient lifecycle signal; never part of a native document. */
  documentRevision: number;
  hoverLoupeEnabled: boolean;
  samples:               (Sample | null)[];
  numLanes:              number;
  ctx:                   SimContext;
  selectedLane:          number;
  /** Derived compatibility projection of selection into the open sample panel. */
  selectedFragmentIndex: number | null;
  /**
   * Sticky pointer to the lane whose sample should populate the middle Sample
   * panel. Updated on tube/band selection and cleared when the sample
   * view closes, gel settings opens, or the document is replaced. Drives "show the most recently selected sample after the user
   * deselects a band" behavior.
   */
  lastSampleLane:        number | null;
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
  /** Cosmetic gel rotation in degrees (M17 placeholder — not wired to sim). */
  gelRotate:             number;
}

export type Action =
  | { type: 'SYNC_SELECTION_VIEW' }
  | { type: 'SET_VOLTAGE';        value: number }
  | { type: 'SET_TIME';           value: number }
  | { type: 'SET_WELL_DAMAGE';    value: number }
  | { type: 'SET_GEL_BUFFER';     value: 'TBE' | 'TAE' | 'H2O' }
  | { type: 'SET_SAMPLE_BUFFER';  laneIndex: number; buffer: Buffer }
  | { type: 'SET_DYE_MASS';       laneIndex: number; dye: number; mass: number }
  | { type: 'LOAD_FIXTURE';       key: string; sample: Sample; lane: number }
  | { type: 'IMPORT_SAMPLE'; sample: Sample; preferredLane?: number }
  | { type: 'LOAD_GEL_STATE';    samples: (Sample | null)[]; numLanes: number; ctx: SimContext }
  | { type: 'SET_SELECTED_LANE';  laneIndex: number }
  | { type: 'SET_SELECTED';       laneIndex: number; index: number | null }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'BEGIN_DRAG';         laneIndex: number; fragmentIndex: number; startY: number; referenceY?: number; aggregate?: number }
  | { type: 'UPDATE_BAND_DRAG'; x: number; y: number; shift: boolean }
  | { type: 'END_DRAG' }
  | { type: 'BEGIN_SAMPLE_DRAG';  laneIndex: number; clone?: boolean }
  | { type: 'UPDATE_SAMPLE_DRAG'; laneIndex: number }
  | { type: 'END_SAMPLE_DRAG' }
  | { type: 'MOVE_SAMPLE';        from: number; to: number }
  | { type: 'CLONE_SAMPLE_TO_LANE'; from: number; to: number }
  | { type: 'CLONE_FRAGMENT'; laneIndex: number; sourceIndex: number; color?: [number, number, number] }
  | { type: 'ADD_FRAGMENT'; laneIndex: number; fragment: Fragment }
  | { type: 'DELETE_FRAGMENT'; laneIndex: number; index: number }
  | { type: 'TOGGLE_SAMPLE_SETTINGS' }
  | { type: 'CLOSE_SAMPLE' }
  | { type: 'SET_FRAGMENT_BASES'; laneIndex: number; index: number; bases: number }
  | { type: 'SET_FRAGMENT_MASS';     laneIndex: number; index: number; mass: number }
  | { type: 'SET_FRAGMENT_ASPECT';   laneIndex: number; index: number; aspectRatio: number }
  | { type: 'SET_FRAGMENT_AGGREGATE'; laneIndex: number; index: number; aggregate: number[] }
  | { type: 'SET_FRAGMENT_DEGRADE';  laneIndex: number; index: number; degrade: number }
  | { type: 'SET_FRAGMENT_COLOR';    laneIndex: number; index: number; color: [number, number, number] }
  | { type: 'SET_MODIFIERS';      modifiers: { shift: boolean; alt: boolean; meta: boolean } }
  | { type: 'SET_HOVER_LOUPE_ENABLED'; value: boolean }
  | { type: 'TOGGLE_HOVER_LOUPE' }
  | { type: 'ADD_LOUPE'; anchor: { x: number; y: number } }
  | { type: 'MOVE_LOUPE'; id: number; mode: 'frame' | 'anchor' | 'both'; delta: {x:number;y:number} }
  | { type: 'RAISE_LOUPE'; id: number }
  | { type: 'REMOVE_LOUPE';  id: number }
  | { type: 'CLEAR_LOUPES' }
  | { type: 'SET_SELECTION'; ref: SampleFragRef | null }
  | { type: 'SET_ROLLOVER';  ref: SampleFragRef | null }
  | { type: 'CLEAR_ROLLOVER_IF'; ref: SampleFragRef }
  | { type: 'SET_INSPECTOR_MODE'; mode: InspectorMode }
  | { type: 'CLEAR_FRAGMENT_SELECTION' }
  | { type: 'SET_NUM_LANES';      value: number }
  | { type: 'SET_GEL_ROTATE';     value: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const BUFFER_BY_KEY = {
  TBE: BUFFER_TBE,
  TAE: BUFFER_TAE,
  H2O: BUFFER_H2O,
} as const;

// C++ Gel::getWellSize() = (laneWidth*0.5, laneWidth*0.1) centered at (laneCenterX, yMargin).
function computeWellRects(numLanes: number, gelSize: { width: number; height: number }): Rect[] {
  const laneWidth = gelSize.width / numLanes;
  const wellWidth  = laneWidth * 0.5;
  const wellHeight = laneWidth * 0.1;
  const out: Rect[] = [];
  for (let i = 0; i < numLanes; i++) {
    const cx = laneWidth * (i + 0.5);
    const cy = Y_MARGIN;
    out.push({
      x1: cx - wellWidth / 2,
      y1: cy - wellHeight / 2,
      x2: cx + wellWidth / 2,
      y2: cy + wellHeight / 2,
    });
  }
  return out;
}

export function initialGelState(): GelState {
  const sample = copySample(ladder as unknown as Sample);
  const samples: (Sample | null)[] = new Array(NUM_LANES).fill(null);
  samples[0] = sample;
  return {
    documentRevision: 0,
    hoverLoupeEnabled: false,
    samples,
    numLanes: NUM_LANES,
    ctx: {
      voltage: 70,
      time:    1.0,
      ySpaceScale: computeYSpaceScale(GEL_SIZE.width, GEL_SIZE.height, NUM_LANES, Y_MARGIN),
      wellDamage: 0,
      gelBuffer: BUFFER_TBE,
      sampleBuffer: sample.buffer,
    },
    selectedLane: 0,
    // Nothing is selected on first load — Sample/Species panels stay hidden
    // until the user clicks a tube or a band (matches Gelbox app behavior).
    selectedFragmentIndex: null,
    lastSampleLane: null,
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
    gelRotate: 0,
  };
}

/**
 * Sample panel is sticky after first interaction: once the user has clicked
 * any non-empty tube or band, the Sample slot stays populated, showing the
 * last-selected sample (lastSampleLane) even if the current selection is
 * cleared. Returns null before first interaction.
 */
export function getVisibleSampleLane(state: GelState): number | null {
  if (state.lastSampleLane === null) return null;
  if (state.samples[state.lastSampleLane] === null) return null;
  return state.lastSampleLane;
}

/**
 * Inspector panel only shows when there's actual content for it: a fragment
 * is currently selected (Species), or the gear is engaged (Gel settings),
 * or a sample is currently selected with no fragment (Buffer + Dyes).
 */
export function isInspectorVisible(state: GelState): boolean {
  return selectInspectorView(state) !== 'none';
}

/**
 * Single source of truth for which inspector mode is currently showing.
 *
 * Decision matrix (precedence top → bottom; first match wins):
 *
 *   1. `inspectorMode === 'gel-settings'`        → 'gel-settings'  (gear wins)
 *   2. valid rollover/selection in open sample     → species/dye inspector
 *   3. tube has a sample, mode === sample-settings → 'sample-settings' (Buffer + Dyes)
 *   4. else                                       → 'none'           (panel hidden)
 *
 * Codifies the rules previously scattered across `isInspectorVisible` and
 * `<InspectorPanel>` so M18 can rely on a single function for the swap.
 */
export type InspectorView = 'none' | 'gel-settings' | 'sample-settings' | 'fragment';

/** Native SampleView::getFocusFragment: rollover, then shared selection,
 * restricted to the sample already open in this view. */
export function getFocusedFragmentIndex(state: GelState): number | null {
  const lane=getVisibleSampleLane(state);
  if(lane===null)return null;
  for(const ref of [state.rollover,state.selection]) {
    const index = fragmentIndexIn(ref, state.samples[lane]);
    if(index !== null)return index;
  }
  return null;
}

export function selectInspectorView(state: GelState): InspectorView {
  if (state.inspectorMode === 'gel-settings') return 'gel-settings';
  const focus=getFocusedFragmentIndex(state);
  if (focus !== null) {
    const f = state.samples[state.lastSampleLane!]?.fragments[focus];
    if (f) return f.dye >= 0 ? 'sample-settings' : 'fragment';
  }
  if (state.inspectorMode === 'sample-settings'
      && state.samples[state.selectedLane] !== null) {
    return 'sample-settings';
  }
  return 'none';
}

function selectFragment(state: GelState, lane: number, index: number | null): GelState {
  const sample = state.samples[lane];
  if (!sample) return state;
  const fragment = index === null ? null : sample.fragments[index];
  return { ...state, selectedLane: lane, selectedFragmentIndex: index,
    selection: { sample, fragmentIndex: index }, lastSampleLane: lane,
    ctx: { ...state.ctx, sampleBuffer: sample.buffer },
    inspectorMode: fragment ? (fragment.dye >= 0 ? 'sample-settings' : 'fragment') : 'default' };
}

/** Native GelView::tick follows the selected sample, even with an invalid
 * fragment. undefined means no view change; null closes an off-gel view. */
export function selectionViewTarget(state: GelState): number | null | undefined {
  if (!state.selection || sameSample(state.selection.sample,
    state.lastSampleLane === null ? null : state.samples[state.lastSampleLane])) return undefined;
  const lane = state.samples.slice(0, state.numLanes).findIndex(sample => sameSample(sample, state.selection!.sample));
  const target = lane === -1 ? null : lane;
  return target === state.lastSampleLane ? undefined : target;
}

export function gelReducer(state: GelState, action: Action): GelState {
  let next = reduceGelState(state, action);
  if (next === state) return state;
  // Refresh references to the immutable version representing the same native
  // sample. Removed samples remain owned by their references; no global store.
  const candidates = next.samples.slice();
  if (next.drag?.type === 'sample') candidates.push(next.drag.sample);
  const selection = refreshSampleRef(next.selection, candidates);
  const rollover = refreshSampleRef(next.rollover, candidates);
  const panel = next.lastSampleLane === null ? null : next.samples[next.lastSampleLane];
  next = { ...next, selection, rollover,
    selectedFragmentIndex: fragmentIndexIn(selection, panel) };
  if (next.drag?.type === 'sample') {
    const retained = next.drag.sample;
    const sample = next.samples.find(s => sameSample(s, retained));
    if (sample && sample !== next.drag.sample) next = { ...next, drag: { ...next.drag, sample } };
  }
  return next;
}

function reduceGelState(state: GelState, action: Action): GelState {
  switch (action.type) {
    case 'SYNC_SELECTION_VIEW': {
      const target = selectionViewTarget(state);
      if (target === undefined) return state;
      return { ...state, selectedLane: target ?? -1, lastSampleLane: target, inspectorMode: 'default',
        ctx: target === null ? state.ctx : { ...state.ctx, sampleBuffer: state.samples[target]!.buffer } };
    }
    case 'SET_VOLTAGE':
      return { ...state, ctx: { ...state.ctx, voltage: action.value } };
    case 'SET_TIME':
      return { ...state, ctx: { ...state.ctx, time: clamp(action.value, 0, 1) } };
    case 'SET_WELL_DAMAGE':
      return { ...state, ctx: { ...state.ctx, wellDamage: clamp(action.value, 0, 1) } };
    case 'SET_GEL_BUFFER':
      return { ...state, ctx: { ...state.ctx, gelBuffer: BUFFER_BY_KEY[action.value] } };
    case 'SET_SAMPLE_BUFFER': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { buffer: action.buffer });
      const ctx = action.laneIndex === state.selectedLane
        ? { ...state.ctx, sampleBuffer: action.buffer }
        : state.ctx;
      return { ...state, samples, ctx };
    }
    case 'SET_DYE_MASS': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const i = sample.fragments.findIndex((f) => f.dye === action.dye);
      let fragments: Fragment[];
      if (i === -1) {
        // Lazy-create dye fragment on first non-zero write — mirrors
        // C++ Sample::setDye(dye, val) which pushes a new fragment when
        // the dye isn't present. Zero-mass writes when no fragment exists
        // are no-ops (don't pollute the fragment list).
        if (action.mass <= 0) return state;
        const color = DYE_COLORS[action.dye];
        fragments = [
          ...sample.fragments,
          {
            bases:       1,
            mass:        action.mass,
            degrade:     0,
            dye:         action.dye,
            aggregate:   [],
            aspectRatio: 1,
            color:       [color[0], color[1], color[2]],
          },
        ];
      } else {
        fragments = sample.fragments.map((f, j) =>
          j === i ? { ...f, mass: action.mass } : f
        );
      }
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      return { ...state, samples };
    }
    case 'IMPORT_SAMPLE': {
      const preferred = action.preferredLane ?? -1;
      const lane = Number.isInteger(preferred) && preferred >= 0 && preferred < state.numLanes && !state.samples[preferred]
        ? preferred : state.samples.slice(0, state.numLanes).findIndex(s => !s);
      if (lane < 0) return state;
      const samples = state.samples.slice();
      samples[lane] = copySample(action.sample);
      return { ...state, samples };
    }
    case 'LOAD_FIXTURE': {
      const samples = state.samples.slice();
      samples[action.lane] = copySample(action.sample);
      return {
        ...state,
        samples,
        fixtureKey: action.key,
        selectedLane: action.lane,
        // Don't auto-select on load — let the user click into a band/tube to
        // open the Sample/Species panels.
        selectedFragmentIndex: null,
        ctx: { ...state.ctx, sampleBuffer: action.sample.buffer },
        drag: null,
      };
    }
    case 'LOAD_GEL_STATE': {
      const wellRects = computeWellRects(action.numLanes, state.gelSize);
      return {
        ...state,
        documentRevision: state.documentRevision + 1,
        samples: action.samples.map(sample => sample ? copySample(sample) : null),
        numLanes: action.numLanes,
        ctx: action.ctx,
        wellRects,
        lastSampleLane: null, selection: null, rollover: null, loupes: [],
        inspectorMode: 'default',
        selectedLane: 0,
        selectedFragmentIndex: null,
        drag: null,
      };
    }
    case 'SET_SELECTED_LANE': {
      if (action.laneIndex < 0 || action.laneIndex >= state.numLanes) return state;
      if (state.lastSampleLane === action.laneIndex) return state;
      const samples = state.samples.slice();
      const sample = samples[action.laneIndex] ?? { fragments: [], buffer: { ...BUFFER_TBE } };
      samples[action.laneIndex] = sample;
      return { ...state, samples, selectedLane: action.laneIndex,
        selectedFragmentIndex: null, lastSampleLane: action.laneIndex,
        selection: sameSample(state.selection?.sample, sample) ? state.selection : null,
        ctx: { ...state.ctx, sampleBuffer: sample.buffer }, inspectorMode: 'default' };
    }
    case 'SET_SELECTED':
      return selectFragment(state, action.laneIndex, action.index);
    case 'SELECT_NEXT':
    case 'SELECT_PREV': {
      if (state.lastSampleLane === null || state.selectedLane >= state.numLanes) return state;
      const n = state.samples[state.selectedLane]?.fragments.length ?? 0;
      if(!sameSample(state.selection?.sample, state.samples[state.lastSampleLane]))return state;
      const cur = state.selection!.fragmentIndex;
      if (cur === null && n === 0) return state;
      const next = action.type === 'SELECT_NEXT'
        ? (cur === null ? 0 : cur + 1 >= n ? null : cur + 1)
        : (cur === null ? n - 1 : cur === 0 ? null : cur - 1);
      return selectFragment(state, state.selectedLane, next);
    }
    case 'TOGGLE_SAMPLE_SETTINGS':
      if (state.lastSampleLane === null) return state;
      return { ...selectFragment(state, state.lastSampleLane, null),
        inspectorMode: state.inspectorMode === 'sample-settings' ? 'default' : 'sample-settings' };
    case 'CLOSE_SAMPLE':
      return { ...state, lastSampleLane: null, selectedFragmentIndex: null,
        drag: null, inspectorMode: 'default' };
    case 'ADD_FRAGMENT': {
      if (action.laneIndex < 0 || action.laneIndex >= state.numLanes) return state;
      const samples = state.samples.slice();
      const sample = samples[action.laneIndex] ?? { fragments: [], buffer: { ...BUFFER_TBE } };
      samples[action.laneIndex] = reviseSample(sample, { fragments: [...sample.fragments, action.fragment] });
      return selectFragment({ ...state, samples }, action.laneIndex, sample.fragments.length);
    }
    case 'DELETE_FRAGMENT': {
      const sample = state.samples[action.laneIndex];
      if (!sample?.fragments[action.index]) return state;
      const last = sample.fragments.length - 1;
      const fragments = sample.fragments.slice();
      fragments[action.index] = fragments[last];
      fragments.pop();
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      // The keyboard path deselects its selected fragment first. All other
      // references keep their raw index, including the old last (now invalid).
      const selected = sameSample(state.selection?.sample, sample) && state.selection?.fragmentIndex === action.index;
      return { ...state, samples,
        selection: selected ? { sample: samples[action.laneIndex]!, fragmentIndex: null } : state.selection,
        drag: state.drag?.type === 'sample' ? state.drag : null,
        inspectorMode: selected && state.inspectorMode === 'fragment' ? 'default' : state.inspectorMode };
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
          referenceY: action.referenceY ?? action.startY,
          aggregate: action.aggregate ?? 1,
          startBases: frag.dye >= 0 ? DYE_BP_LO[frag.dye] : frag.bases,
          temporaryLane: null,
        },
        ctx: { ...state.ctx, sampleBuffer: sample.buffer },
        selectedLane: action.laneIndex,
        selectedFragmentIndex: action.fragmentIndex,
        lastSampleLane: action.laneIndex,
        // Drag-selecting a band opens the Species inspector too.
        selection: { sample, fragmentIndex: action.fragmentIndex },
        inspectorMode: frag.dye >= 0 ? 'sample-settings' : 'fragment',
      };
    }
    case 'UPDATE_BAND_DRAG': {
      const drag = state.drag;
      if (drag?.type !== 'band') return state;
      const sample = state.samples[drag.laneIndex];
      const frag = sample?.fragments[drag.fragmentIndex];
      if (!sample || !frag) return { ...state, drag: null };
      const bases = action.shift ? drag.startBases : frag.dye >= 0 ? frag.bases
        : clamp(solveBasesForY({ targetY: action.y + drag.referenceY - drag.startY,
            aggregate: drag.aggregate, frag, lane: drag.laneIndex,
            ctx: { ...state.ctx, sampleBuffer: sample.buffer }, wellRect: state.wellRects[drag.laneIndex] }),
          1, GEL_SIM_TUNING.baseCountHigh);
      const moved = { ...frag, bases };
      const samples = state.samples.slice();
      let lane = drag.laneIndex, index = drag.fragmentIndex, temporaryLane = drag.temporaryLane;
      // Native uses the well width for lane picking, with full-height gutters.
      const target = Math.min(state.numLanes - 1, Math.floor(action.x / state.gelSize.width * state.numLanes));
      const well = state.wellRects[target];
      const inside = action.y >= 0 && action.y <= state.gelSize.height && well
        && action.x >= well.x1 && action.x <= well.x2;
      if (inside && target !== lane) {
        if (temporaryLane === lane) samples[lane] = null;
        else {
          const fragments = sample.fragments.slice();
          fragments[index] = fragments[fragments.length - 1];
          fragments.pop();
          samples[lane] = reviseSample(sample, { fragments });
        }
        temporaryLane = samples[target] ? null : target;
        const destination = samples[target] ?? { buffer: { ...BUFFER_TBE }, fragments: [] };
        index = destination.fragments.length;
        samples[target] = reviseSample(destination, { fragments: [...destination.fragments, moved] });
        lane = target;
      } else {
        const fragments = sample.fragments.slice();
        fragments[index] = moved;
        samples[lane] = reviseSample(sample, { fragments });
      }
      const next = { ...state, samples,
        drag: { ...drag, laneIndex: lane, fragmentIndex: index, temporaryLane } };
      return lane === drag.laneIndex ? next : selectFragment(next, lane, index);
    }
    case 'END_DRAG': {
      const drag = state.drag;
      if (drag?.type !== 'band') return { ...state, drag: null };
      const sample = state.samples[drag.laneIndex];
      if (!sample) return { ...state, drag: null };
      // Sample::mergeDuplicateDyes keeps the earliest entry and its metadata.
      const fragments: Fragment[] = [];
      const dyes = new Map<number, number>();
      for (const frag of sample.fragments) {
        if (frag.dye < 0) { fragments.push(frag); continue; }
        const first = dyes.get(frag.dye);
        if (first === undefined) {
          dyes.set(frag.dye, fragments.length);
          fragments.push({ ...frag, mass: Math.fround(frag.mass) });
        } else fragments[first] = { ...fragments[first], mass: Math.fround(fragments[first].mass + Math.fround(frag.mass)) };
      }
      for (const i of dyes.values()) fragments[i] = { ...fragments[i], mass: Math.min(DYE_MAX_MASS, fragments[i].mass) };
      const samples = state.samples.slice();
      samples[drag.laneIndex] = reviseSample(sample, { fragments });
      const next = { ...state, samples, drag: null };
      // Native does not clear invalid external indices after dye compaction.
      return next;
    }
    case 'BEGIN_SAMPLE_DRAG': {
      const lane = action.laneIndex;
      if (lane < 0 || lane >= state.numLanes) return state;
      const opened = gelReducer(state, { type: 'SET_SELECTED_LANE', laneIndex: lane });
      const sample = opened.samples[lane]!;
      const clone = action.clone && state.samples[lane] !== null;
      return { ...opened,
        selection: sameSample(state.selection?.sample, sample) ? state.selection : null,
        drag: { type: 'sample', laneIndex: clone ? -1 : lane,
          sample: clone ? copySample(sample) : sample } };
    }
    case 'UPDATE_SAMPLE_DRAG': {
      const drag = state.drag;
      if (drag?.type !== 'sample') return state;
      const target = action.laneIndex >= 0 && action.laneIndex < state.numLanes ? action.laneIndex : -1;
      if (target === drag.laneIndex) return state;
      const samples = state.samples.slice();
      if (drag.laneIndex !== -1) samples[drag.laneIndex] = null;
      const lane = target !== -1 && samples[target] === null ? target : -1;
      if (lane !== -1) samples[lane] = drag.sample;
      return { ...state, samples, drag: { ...drag, laneIndex: lane },
        selectedLane: lane, lastSampleLane: lane === -1 ? null : lane,
        inspectorMode: 'default',
        ctx: lane === -1 ? state.ctx : { ...state.ctx, sampleBuffer: drag.sample.buffer } };
    }
    case 'END_SAMPLE_DRAG':
      return { ...state, drag: null };
    case 'MOVE_SAMPLE':
    case 'CLONE_SAMPLE_TO_LANE': {
      if (action.from === action.to || !state.samples[action.from]) return state;
      const begun = gelReducer(state, { type: 'BEGIN_SAMPLE_DRAG', laneIndex: action.from,
        clone: action.type === 'CLONE_SAMPLE_TO_LANE' });
      const moved = gelReducer(begun, { type: 'UPDATE_SAMPLE_DRAG', laneIndex: action.to });
      return gelReducer(moved, { type: 'END_SAMPLE_DRAG' });
    }
    case 'CLONE_FRAGMENT': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const src = sample.fragments[action.sourceIndex];
      if (!src) return state;
      const clone = { ...src, color: [...(action.color ?? src.color)] as [number, number, number], aggregate: [...src.aggregate] };
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments: [...sample.fragments, clone] });
      return selectFragment({ ...state, samples }, action.laneIndex, sample.fragments.length);
    }
    case 'SET_FRAGMENT_BASES': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, bases: action.bases } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_MASS': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, mass: action.mass } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_ASPECT': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, aspectRatio: action.aspectRatio } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_AGGREGATE': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, aggregate: action.aggregate.slice() } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_DEGRADE': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, degrade: action.degrade } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      return { ...state, samples };
    }
    case 'SET_FRAGMENT_COLOR': {
      const sample = state.samples[action.laneIndex];
      if (!sample) return state;
      const fragments = sample.fragments.map((f, i) =>
        i === action.index ? { ...f, color: action.color } : f
      );
      const samples = state.samples.slice();
      samples[action.laneIndex] = reviseSample(sample, { fragments });
      return { ...state, samples };
    }
    case 'SET_HOVER_LOUPE_ENABLED':
      return { ...state, hoverLoupeEnabled: action.value };
    case 'TOGGLE_HOVER_LOUPE':
      return { ...state, hoverLoupeEnabled: !state.hoverLoupeEnabled };
    case 'SET_MODIFIERS':
      return { ...state, modifiers: action.modifiers };
    case 'ADD_LOUPE': {
      const id = state.loupeNextId;
      return {
        ...state,
        loupes: [...state.loupes, { id, anchor: action.anchor, frame: {x:Math.fround(action.anchor.x+85.5),y:Math.fround(action.anchor.y-85.5)} }],
        loupeNextId: id + 1,
      };
    }
    case 'MOVE_LOUPE': {
      const move=(p:{x:number;y:number})=>({x:Math.fround(p.x+action.delta.x),y:Math.fround(p.y+action.delta.y)});
      return {...state,loupes:state.loupes.map(l=>l.id!==action.id?l:{...l,
        anchor:action.mode==='frame'?l.anchor:move(l.anchor),
        frame:action.mode==='anchor'?l.frame:move(l.frame)})};
    }
    case 'RAISE_LOUPE': {
      const loupe=state.loupes.find(l=>l.id===action.id);
      return !loupe || state.loupes.at(-1)===loupe ? state : {...state,loupes:[...state.loupes.filter(l=>l!==loupe),loupe]};
    }
    case 'REMOVE_LOUPE':
      return { ...state, loupes: state.loupes.filter((l) => l.id !== action.id) };
    case 'CLEAR_LOUPES':
      return { ...state, loupes: [], loupeNextId: 1 };
    case 'SET_SELECTION':
      if (sampleFragRefEq(state.selection, action.ref)) return state;
      return { ...state, selection: action.ref };
    case 'CLEAR_ROLLOVER_IF':
      return sampleFragRefEq(state.rollover,action.ref) ? {...state,rollover:null} : state;
    case 'SET_ROLLOVER':
      if (sampleFragRefEq(state.rollover, action.ref)) return state;
      return { ...state, rollover: action.ref };
    case 'SET_INSPECTOR_MODE':
      if (state.inspectorMode === action.mode) return state;
      if (action.mode === 'gel-settings') {
        // Native settings entry deselects fragments and closes the sample view.
        return { ...state, inspectorMode: action.mode, lastSampleLane: null,
          selectedFragmentIndex: null, selection: null, rollover: null, drag: null };
      }
      return { ...state, inspectorMode: action.mode };
    case 'SET_NUM_LANES': {
      const numLanes = Math.max(1, Math.round(action.value));
      if (numLanes === state.numLanes) return state;
      const wellRects = computeWellRects(numLanes, state.gelSize);
      // Native Gel::setLayout retains hidden lanes, growing storage only.
      // Rendering/export use numLanes; restoring the count recovers the samples.
      const samples = state.samples.slice();
      while (samples.length < numLanes) samples.push(null);
      // Recompute ySpaceScale (depends on lane width which depends on numLanes).
      const ySpaceScale = computeYSpaceScale(state.gelSize.width, state.gelSize.height, numLanes, Y_MARGIN);
      return {
        ...state,
        numLanes,
        samples,
        wellRects,
        ctx: { ...state.ctx, ySpaceScale },
      };
    }
    case 'SET_GEL_ROTATE':
      return { ...state, gelRotate: action.value };
    case 'CLEAR_FRAGMENT_SELECTION':
      return {...state,selection:null,selectedFragmentIndex:null};
    default: {
      const _: never = action;
      void _;
      return state;
    }
  }
}
