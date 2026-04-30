import type { Sample } from '../sim/sample';
import type { SimContext } from '../sim/gelSim';
import type { Buffer } from '../sim/buffer';

export interface SerializedSample {
  schema:    'gel-sample-v0';
  buffer:    Buffer;
  fragments: Sample['fragments'];
}

export interface SerializedGelState {
  schema:   'gel-state-v0';
  numLanes: number;
  samples:  (Sample | null)[];
  ctx: {
    voltage:      number;
    time:         number;
    ySpaceScale:  number;
    wellDamage:   number;
    gelBuffer:    Buffer;
    sampleBuffer: Buffer;
  };
}

export type DeserializedFile =
  | { kind: 'sample'; sample: Sample }
  | { kind: 'state';  samples: (Sample | null)[]; numLanes: number; ctx: SimContext };

export function serializeSample(s: Sample): string {
  const out: SerializedSample = {
    schema:    'gel-sample-v0',
    buffer:    s.buffer,
    fragments: s.fragments,
  };
  return JSON.stringify(out, null, 2);
}

export function serializeGelState(state: {
  samples: (Sample | null)[];
  numLanes: number;
  ctx: SimContext;
}): string {
  const out: SerializedGelState = {
    schema:   'gel-state-v0',
    numLanes: state.numLanes,
    samples:  state.samples,
    ctx:      state.ctx,
  };
  return JSON.stringify(out, null, 2);
}

export function deserializeFile(text: string): DeserializedFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Not valid JSON: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON root must be an object');
  }
  const obj = parsed as { schema?: unknown };
  if (obj.schema === 'gel-sample-v0') {
    const s = parsed as SerializedSample;
    return { kind: 'sample', sample: { buffer: s.buffer, fragments: s.fragments } };
  }
  if (obj.schema === 'gel-state-v0') {
    const s = parsed as SerializedGelState;
    return { kind: 'state', samples: s.samples, numLanes: s.numLanes, ctx: s.ctx };
  }
  throw new Error(`Unknown schema: ${String(obj.schema)}`);
}
