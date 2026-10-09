import type { DeserializedFile } from './serialize';
import type { Sample, Fragment } from '../sim/sample';
import { BUFFER_TBE, type Buffer } from '../sim/buffer';
import { DYE_NAMES } from '../sim/dye';

type ObjectValue = Record<string, unknown>;
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
function string(value: unknown, fallback: string, path: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') return invalid(path);
  return value;
}
function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) return invalid(path);
  return value;
}
function buffer(value: unknown, path: string): Buffer {
  if (value === undefined) return { ...BUFFER_TBE };
  const b = object(value, path);
  return {
    tris: number(b.Tris, 0, `${path}.Tris`),
    borate: number(b.Borate, 0, `${path}.Borate`),
    acetate: number(b.Acetate, 0, `${path}.Acetate`),
    edta: number(b.EDTA, 0, `${path}.EDTA`),
  };
}
function fragment(value: unknown, path: string): Fragment {
  const f = object(value, path);
  const color = f.Color === undefined ? [0.5, 0.5, 0.5] : array(f.Color, `${path}.Color`);
  if (color.length !== 3) return invalid(`${path}.Color`);
  const dye = string(f.Dye, '', `${path}.Dye`);
  return {
    bases: number(f.Bases, 0, `${path}.Bases`),
    mass: number(f.Mass, 0, `${path}.Mass`),
    degrade: number(f.Degrade, 0, `${path}.Degrade`),
    aspectRatio: number(f.AspectRatio, 1, `${path}.AspectRatio`),
    color: color.map((v, i) => number(v, 0.5, `${path}.Color[${i}]`)) as Fragment['color'],
    dye: DYE_NAMES.findIndex(name => name === dye),
    aggregate: f.Aggregate === undefined ? [] : array(f.Aggregate, `${path}.Aggregate`).map((v, i) => number(v, 0, `${path}.Aggregate[${i}]`)),
  };
}
function sample(value: unknown, path: string): Sample {
  const s = object(value, path);
  return {
    name: string(s.name, '', `${path}.name`),
    icon: string(s.icon, '', `${path}.icon`),
    iconScale: number(s.iconScale, 1, `${path}.iconScale`),
    id: number(s.id, -1, `${path}.id`),
    buffer: buffer(s.Buffer, `${path}.Buffer`),
    fragments: s.Fragments === undefined ? [] : array(s.Fragments, `${path}.Fragments`).map((f, i) => fragment(f, `${path}.Fragments[${i}]`)),
  };
}

/** Decode native data only; pointer-valued OriginSample fields are intentionally ignored. */
export function deserializeNativeFile(value: unknown): DeserializedFile {
  const root = object(value, 'root');
  const header = object(root.Gelbox, 'Gelbox');
  if (header.version !== '1.0') return invalid('Gelbox.version');
  if (header.type === 'sample') return { kind: 'sample', sample: sample(root.Sample, 'Sample') };
  if (header.type !== 'gel') return invalid('Gelbox.type');
  const gel = object(root.Gel, 'Gel');
  const samples = array(gel.Samples, 'Gel.Samples').map((s, i) => s === null ? null : sample(s, `Gel.Samples[${i}]`));
  // Gel::constrainNumLanesToSliderMinMax retains hidden sample storage.
  const numLanes = Math.min(20, Math.max(7, samples.length));
  while (samples.length < numLanes) samples.push(null);
  return {
    kind: 'state', samples, numLanes,
    ctx: {
      time: number(gel.Time, 1, 'Gel.Time'),
      voltage: number(gel.Voltage, 0, 'Gel.Voltage'),
      wellDamage: number(gel.WellDamage, 0, 'Gel.WellDamage'),
      gelBuffer: buffer(gel.Buffer, 'Gel.Buffer'),
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
    name: s.name ?? '', icon: s.icon ?? '', iconScale: s.iconScale ?? 1, id: s.id ?? -1,
    Buffer: nativeBuffer(s.buffer),
    Fragments: s.fragments.map(f => ({
      Bases: f.bases, Mass: f.mass, Degrade: f.degrade,
      AspectRatio: f.aspectRatio, Color: f.color,
      ...(f.dye === -1 ? {} : { Dye: DYE_NAMES[f.dye] }),
      ...(f.aggregate.length === 0 ? {} : { Aggregate: f.aggregate }),
    })),
  };
}
