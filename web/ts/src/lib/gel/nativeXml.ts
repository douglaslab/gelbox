import { deserializeNativeFile } from './nativeFile';
import type { DeserializedFile } from './serialize';

/** Native legacy palette format. Uses browser XML parsing, without external entity fetching. */
export function deserializeNativeXml(text: string): DeserializedFile {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  const root = document.documentElement;
  if (document.querySelector('parsererror') || root?.tagName !== 'Sample') {
    throw new Error('Invalid XML: expected a well-formed Sample document');
  }
  const numeric = (value: string | null, fallback: number, field: string): number => {
    if (value === null) return fallback;
    if (!value.trim() || !Number.isFinite(Number(value))) throw new Error(`Invalid XML number: ${field}`);
    return Number(value);
  };
  const fragments = Array.from(root.children).filter(e => e.tagName === 'Fragment').map(element => {
    const child = (tag: string) => Array.from(element.children).find(e => e.tagName === tag);
    const value = (tag: string, fallback: number) => numeric(child(tag)?.getAttribute('value') ?? null, fallback, tag);
    const colorNode = child('Color');
    let Color = [0.5, 0.5, 0.5];
    if (colorNode) {
      // Native strtoul(..., 16) accepts conventional 0x prefixes and whitespace.
      const hex = (colorNode.getAttribute('value') ?? '000000').trim();
      if (!/^(?:0x)?[0-9a-f]{1,6}$/i.test(hex)) throw new Error('Invalid XML color');
      const rgb = parseInt(hex, 16);
      Color = [(rgb >> 16 & 255) / 255, (rgb >> 8 & 255) / 255, (rgb & 255) / 255];
    }
    const Aggregate = [1];
    for (const a of Array.from(element.children).filter(e => e.tagName === 'Aggregate')) {
      if (!a.hasAttribute('Size') || !a.hasAttribute('Weight')) continue; // native logs and skips
      const size = numeric(a.getAttribute('Size'), 0, 'Aggregate.Size');
      const weight = numeric(a.getAttribute('Weight'), 0, 'Aggregate.Weight');
      // Native resizes to Size, then writes [Size]. Only index zero is safe
      // from the default monomer array. Do not emulate that memory corruption.
      if (size !== 0 || !Number.isInteger(weight)) throw new Error('Unsupported legacy XML aggregate; use native JSON for multimers');
      Aggregate[0] = weight;
    }
    return { Bases: value('Bases', 0), Mass: value('Mass', 0), Degrade: value('Degrade', 0), Color, Aggregate };
  });
  // Native XML ignores id, Buffer, Dye and AspectRatio, despite writing some
  // of them in toXml(). JSON is the lossless interchange format.
  return deserializeNativeFile({
    Gelbox: { version: '1.0', type: 'sample' },
    Sample: {
      name: root.getAttribute('name') ?? '', icon: root.getAttribute('icon') ?? '',
      iconScale: numeric(root.getAttribute('iconScale'), 1, 'iconScale'),
      Fragments: fragments,
    },
  });
}
