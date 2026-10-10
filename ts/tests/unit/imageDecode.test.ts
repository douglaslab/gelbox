import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {jpegWithoutExif,pngWithoutExif} from '../../src/lib/gel/imageDecode';
const fixture=(name:string)=>new Uint8Array(readFileSync(`../reference/native/image-decoding/inputs/${name}`));
it.each([1,2,3,4,5,6,7,8])('removes EXIF orientation %s without changing encoded JPEG pixels',n=>{
 expect(jpegWithoutExif(fixture(`orientation-${n}.jpg`))).toEqual(fixture('plain.jpg'));
});
it.each(['opaque.png','alpha.png','animated.gif','orientation-6.png','plain.jpg','srgb.jpg','srgb.png'])('leaves %s unchanged, including color profiles',name=>{
 const bytes=fixture(name);expect(jpegWithoutExif(bytes)).toBe(bytes);
});
it('retains non-EXIF APP1 metadata and ICC segments while removing EXIF',()=>{
 const plain=fixture('srgb.jpg'),exif=fixture('orientation-6.jpg');
 let start=2;while(exif[start+1]!==0xe1)start+=2+exif[start+2]*256+exif[start+3];
 const end=start+2+exif[start+2]*256+exif[start+3],xmp=new Uint8Array([255,225,0,5,88,77,80]);
 const bytes=new Uint8Array([...plain.slice(0,2),...xmp,...exif.slice(start,end),...plain.slice(2)]);
 expect(jpegWithoutExif(bytes)).toEqual(new Uint8Array([...plain.slice(0,2),...xmp,...plain.slice(2)]));
});
it.each([[255,216,255,225,0,0],[255,216,255,225,255,255],[255,216,255],[255,216,0,0]])('leaves malformed input to the decoder: %s',(...values)=>{
 const bytes=new Uint8Array(values);expect(jpegWithoutExif(bytes)).toBe(bytes);
});

it('removes PNG eXIf without changing pixel chunks or their CRCs',()=>{
 expect(pngWithoutExif(fixture('orientation-6.png'))).toEqual(fixture('opaque.png'));
});
it.each(['opaque.png','alpha.png','gamma-linear.png','srgb.png','animated.gif','plain.jpg'])('preserves PNG color data and unrelated formats: %s',name=>{
 const bytes=fixture(name);expect(pngWithoutExif(bytes)).toBe(bytes);
});
it('leaves a truncated PNG to the decoder unchanged',()=>{
 const bytes=fixture('orientation-6.png').slice(0,-2);expect(pngWithoutExif(bytes)).toBe(bytes);
});
