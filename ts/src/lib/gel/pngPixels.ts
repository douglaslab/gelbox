import png from 'pngjs/browser.js';
import {Buffer} from 'buffer';

/** Decode stored PNG samples without canvas color conversion or premultiplication.
 * Cinder converts 16-bit channels to 8-bit by integer division by 257. */
export function decodePngPixels(bytes:Uint8Array):{width:number;height:number;rgba:Uint8Array}{
 const decoded=png.PNG.sync.read(Buffer.from(bytes),{skipRescale:true});
 const {width,height,depth,colorType,data,transColor}=decoded;
 const maximum=colorType===3?255:2**depth-1;
 const rgba=new Uint8Array(width*height*4);
 for(let i=0;i<rgba.length;i+=4){
  // pngjs clears RGB for a tRNS key. Restore those original sample values:
  // native straight-alpha mip generation uses RGB even when alpha is zero.
  const transparent=transColor&&data[i+3]===0;
  for(let c=0;c<4;c++){
   const value=transparent&&c<3?transColor[transColor.length===1?0:c]:data[i+c];
   rgba[i+c]=Math.floor(value*255/maximum);
  }
 }
 return {width,height,rgba};
}
