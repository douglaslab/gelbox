import {it,expect} from 'vitest';
import fs from 'node:fs';
import {decodePngPixels} from '../../src/lib/gel/pngPixels';
const root='../reference/native/image-decoding/';
for(const corpus of ['', 'png-formats/']){
 const cases=JSON.parse(fs.readFileSync(root+corpus+'native.json','utf8'));
 for(const item of cases.filter((c:any)=>c.file.endsWith('.png')&&(c.exit===undefined||c.exit===0))){
  it(`preserves native straight RGBA for ${corpus}${item.file}`,()=>{
   const decoded=decodePngPixels(fs.readFileSync(root+corpus+'inputs/'+item.file));
   expect([decoded.width,decoded.height]).toEqual([item.width,item.height]);
   expect(Buffer.from(decoded.rgba)).toEqual(fs.readFileSync(root+corpus+'decoded/'+item.file+'.rgba'));
  });
 }
}
