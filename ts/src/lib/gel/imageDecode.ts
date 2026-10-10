/**
 * Cinder's macOS loader decodes stored JPEG pixels without applying EXIF
 * orientation. Some browsers rotate/mirror JPEGs even with imageOrientation:none.
 * Remove EXIF APP1 segments before decoding; keep compressed pixels, ICC APP2,
 * and all other segments byte-for-byte. Invalid segment lengths are left intact.
 */
export function jpegWithoutExif(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const removed: [number, number][] = [];
  let pos = 2;
  while (pos < bytes.length) {
    const start = pos;
    if (bytes[pos++] !== 0xff) return bytes;
    while (bytes[pos] === 0xff) pos++;
    const marker = bytes[pos++];
    if (marker === 0xda || marker === 0xd9) break; // Never parse compressed scan data.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (pos + 2 > bytes.length) return bytes;
    const length = bytes[pos] * 256 + bytes[pos + 1];
    const end = pos + length;
    if (length < 2 || end > bytes.length) return bytes;
    if (marker === 0xe1 && length >= 8 &&
        bytes[pos + 2] === 0x45 && bytes[pos + 3] === 0x78 &&
        bytes[pos + 4] === 0x69 && bytes[pos + 5] === 0x66 &&
        bytes[pos + 6] === 0 && bytes[pos + 7] === 0) removed.push([start, end]);
    pos = end;
  }
  if (!removed.length) return bytes;
  return omitRanges(bytes, removed);
}

/** WebKit also applies PNG eXIf orientation. Removing that ancillary chunk leaves
 * pixel and color chunks, including their original CRCs, untouched. */
export function pngWithoutExif(bytes: Uint8Array): Uint8Array {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((v, i) => bytes[i] === v)) return bytes;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const removed: [number, number][] = [];
  let pos = 8;
  while (pos + 12 <= bytes.length) {
    const end = pos + 12 + view.getUint32(pos);
    if (end > bytes.length) return bytes;
    if (bytes[pos+4] === 101 && bytes[pos+5] === 88 && bytes[pos+6] === 73 && bytes[pos+7] === 102) removed.push([pos, end]);
    pos = end;
  }
  if (pos !== bytes.length || !removed.length) return bytes;
  return omitRanges(bytes, removed);
}

function omitRanges(bytes: Uint8Array, removed: [number, number][]): Uint8Array {
  const output = new Uint8Array(bytes.length - removed.reduce((n, [a, b]) => n + b - a, 0));
  let from = 0, to = 0;
  for (const [start, end] of removed) {
    output.set(bytes.subarray(from, start), to);
    to += start - from;
    from = end;
  }
  output.set(bytes.subarray(from), to);
  return output;
}

export async function decodeReferenceImage(file: File): Promise<ImageBitmap> {
  // Sniff the content, since native accepts a JPEG with a .png or .gif filename.
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  let input = file;
  const jpeg = header[0] === 0xff && header[1] === 0xd8;
  const png = header[0] === 137 && header[1] === 80;
  if (jpeg || png) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const normalized = jpeg ? jpegWithoutExif(bytes) : pngWithoutExif(bytes);
    if (normalized !== bytes) input = new File([normalized], file.name, {type:file.type,lastModified:file.lastModified});
  }
  return createImageBitmap(input, {premultiplyAlpha:'none',colorSpaceConversion:'none',imageOrientation:'none'});
}
