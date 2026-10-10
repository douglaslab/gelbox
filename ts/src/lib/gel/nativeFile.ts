import type { DeserializedFile } from './serialize';
import type { Sample, Fragment } from '../sim/sample';
import { BUFFER_TBE, type Buffer } from '../sim/buffer';
import { DYE_NAMES } from '../sim/dye';

type ObjectValue = Record<string, unknown>;
/** Cinder JsonTree defaults to ASCII-insensitive lookup, first jsoncpp-sorted key. */
export function nativeChild(value: ObjectValue, key: string): unknown {
  const fold = (s: string) => s.replace(/[A-Z]/g, c => c.toLowerCase());
  const wanted = fold(key);
  const match = Object.keys(value).sort().find(k => fold(k) === wanted);
  return match === undefined ? undefined : value[match];
}
function invalid(path: string): never {
  throw new Error(`Invalid native Gelbox field: ${path}`);
}
function object(value: unknown, path: string): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid(path);
  return value as ObjectValue;
}
function number(value: unknown, fallback: number, path: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) return invalid(path);
  return value;
}
function integer(value: unknown, fallback: number, path: string): number {
  const n = number(value, fallback, path);
  if (!Number.isInteger(n) || n < -2147483648 || n > 2147483647) return invalid(path);
  return n;
}
function string(value: unknown, fallback: string, path: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') return invalid(path);
  return value;
}
function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) return invalid(path);
  return value;
}
// Cinder JsonTree serializes an empty array as null and iterates it as
// zero children. Keep scalar/color validation separate from these collections.
function collection(value: unknown, path: string): unknown[] {
  return value === null ? [] : array(value, path);
}
// The original release can write Samples as an object when its final lane is
// occupied. Recover the surviving children in JsonTree/jsoncpp member order.
// Missing lanes cannot be reconstructed; exports still preserve full arrays.
function sampleCollection(value: unknown): unknown[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const children = value as ObjectValue;
    return Object.keys(children).sort().map(key => children[key]);
  }
  return collection(value, 'Gel.Samples');
}
function buffer(value: unknown, path: string): Buffer {
  if (value === undefined) return { ...BUFFER_TBE };
  const b = object(value, path);
  return {
    tris: number(nativeChild(b, 'Tris'), 0, `${path}.Tris`),
    borate: number(nativeChild(b, 'Borate'), 0, `${path}.Borate`),
    acetate: number(nativeChild(b, 'Acetate'), 0, `${path}.Acetate`),
    edta: number(nativeChild(b, 'EDTA'), 0, `${path}.EDTA`),
  };
}
function fragment(value: unknown, path: string): Fragment {
  const f = object(value, path);
  const color = nativeChild(f, 'Color') === undefined ? [0.5, 0.5, 0.5] : array(nativeChild(f, 'Color'), `${path}.Color`);
  if (color.length !== 3) return invalid(`${path}.Color`);
  const dye = string(nativeChild(f, 'Dye'), '', `${path}.Dye`);
  return {
    bases: integer(nativeChild(f, 'Bases'), 0, `${path}.Bases`),
    mass: number(nativeChild(f, 'Mass'), 0, `${path}.Mass`),
    degrade: number(nativeChild(f, 'Degrade'), 0, `${path}.Degrade`),
    aspectRatio: number(nativeChild(f, 'AspectRatio'), 1, `${path}.AspectRatio`),
    color: color.map((v, i) => number(v, 0.5, `${path}.Color[${i}]`)) as Fragment['color'],
    dye: DYE_NAMES.findIndex(name => name === dye),
    aggregate: nativeChild(f, 'Aggregate') === undefined ? [1] : collection(nativeChild(f, 'Aggregate'), `${path}.Aggregate`).map((v, i) => number(v, 0, `${path}.Aggregate[${i}]`)),
  };
}
function sample(value: unknown, path: string): Sample {
  const s = object(value, path);
  return {
    name: string(nativeChild(s, 'name'), '', `${path}.name`),
    icon: string(nativeChild(s, 'icon'), '', `${path}.icon`),
    iconScale: number(nativeChild(s, 'iconScale'), 1, `${path}.iconScale`),
    id: integer(nativeChild(s, 'id'), -1, `${path}.id`),
    buffer: buffer(nativeChild(s, 'Buffer'), `${path}.Buffer`),
    fragments: nativeChild(s, 'Fragments') === undefined ? [] : collection(nativeChild(s, 'Fragments'), `${path}.Fragments`).map((f, i) => fragment(f, `${path}.Fragments[${i}]`)),
  };
}

/** Decode native data only; pointer-valued OriginSample fields are intentionally ignored. */
export function deserializeNativeFile(value: unknown): DeserializedFile {
  const root = object(value, 'root');
  const header = object(nativeChild(root, 'Gelbox'), 'Gelbox');
  if (nativeChild(header, 'version') !== '1.0') return invalid('Gelbox.version');
  if (nativeChild(header, 'type') === 'sample') return { kind: 'sample', sample: sample(nativeChild(root, 'Sample'), 'Sample') };
  if (nativeChild(header, 'type') !== 'gel') return invalid('Gelbox.type');
  const gel = object(nativeChild(root, 'Gel'), 'Gel');
  const samples = sampleCollection(nativeChild(gel, 'Samples') ?? []).map((s, i) => s === null || (typeof s === 'object' && !Array.isArray(s) && Object.keys(s).length === 0) ? null : sample(s, `Gel.Samples[${i}]`));
  // Gel::constrainNumLanesToSliderMinMax retains hidden sample storage.
  const numLanes = Math.min(20, Math.max(7, samples.length));
  while (samples.length < numLanes) samples.push(null);
  return {
    kind: 'state', samples, numLanes,
    ctx: {
      time: number(nativeChild(gel, 'Time'), 1, 'Gel.Time'),
      voltage: number(nativeChild(gel, 'Voltage'), 0, 'Gel.Voltage'),
      wellDamage: number(nativeChild(gel, 'WellDamage'), 0, 'Gel.WellDamage'),
      gelBuffer: buffer(nativeChild(gel, 'Buffer'), 'Gel.Buffer'),
      sampleBuffer: { ...BUFFER_TBE },
      // Native saves omit layout. Use the application's default 390×520 gel.
      ySpaceScale: 520 - 20 * 2 - (390 / numLanes) * 0.2,
    },
  };
}

export function nativeBuffer(b: Buffer) {
  return { Tris: b.tris, Borate: b.borate, Acetate: b.acetate, EDTA: b.edta };
}

export function nativeSample(s: Sample) {
  return {
    name: s.name ?? '', icon: s.icon ?? '', iconScale: s.iconScale ?? 1, id: integer(s.id, -1, 'Sample.id'),
    Buffer: nativeBuffer(s.buffer),
    Fragments: s.fragments.map(f => ({
      Bases: integer(f.bases, 0, 'Fragment.Bases'), Mass: f.mass, Degrade: f.degrade,
      AspectRatio: f.aspectRatio, Color: f.color,
      ...(f.dye === -1 ? {} : { Dye: DYE_NAMES[f.dye] }),
      ...(f.aggregate.length === 0 ? {} : { Aggregate: f.aggregate }),
    })),
  };
}
