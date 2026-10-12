import fontData from '../layout/nativeUiFont.json';
import type {PresentationTextureLayer,PresentationTransform,WellRect,PresentationSampling} from './presentationTypes';
interface NativeUiFont {
 ascent:number;descent:number;lineHeight:number;
 characters:Record<string,{glyph:number;advance:number;x:number;y:number}>;
 kerning:Record<string,number>;
 glyphs:Record<string,{atlas:number;area:number[];origin:number[]}>;
 atlases:{name:string;width:number;height:number}[];
}
const fonts:Record<'1'|'2',NativeUiFont>=fontData;
export const nativeUiFont=(scale:1|2):NativeUiFont=>fonts[scale];
const f=Math.fround;
/** Single-line printable ASCII used by native numeric UI values. CoreText keeps
 * advances in double precision; Cinder converts each resulting placement to float. */
export function shapeNativeUiText(text:string,scale:1|2):{size:number[];placements:number[][]}{
 const font=nativeUiFont(scale),placements:number[][]=[];let advance=0;
 for(let i=0;i<text.length;i++){
  const char=font.characters[text[i]];
  if(!char)throw new RangeError('Native UI value text requires printable ASCII');
  placements.push([char.glyph,f(advance+char.x),f(font.ascent+f(char.y))]);
  advance+=char.advance+(font.kerning[text.slice(i,i+2)]??0);
 }
 return {size:[f(advance),text.length?font.lineHeight:0],placements};
}
/** TextureFont::drawGlyphs default pixel snapping happens before view translation. */
export function nativeUiTextQuads(text:string,scale:1|2,baseline:{x:number;y:number}):{atlas:number;rect:WellRect;uv:WellRect}[]{
 const font=nativeUiFont(scale),factor=f(1/scale);
 // Cinder floors the input baseline first, independently of the later rect snap.
 // Fractional advances can cross a pixel boundary if this first snap is omitted.
 const baselineX=Math.floor(f(baseline.x)),baselineY=Math.floor(f(baseline.y));
 return shapeNativeUiText(text,scale).placements.flatMap(([glyph,x,y])=>{
  const info=font.glyphs[glyph];if(!info)return []; // Native default atlas omits spaces and unsupported glyphs.
  const atlas=font.atlases[info.atlas],[u1,v1,u2,v2]=info.area;
  let x1=0,y1=0,x2=f((u2-u1)*factor),y2=f((v2-v1)*factor);
  for(const [dx,dy] of [[f(x*factor),f(y*factor)],
   [f(Math.floor(f(info.origin[0]+.5))*factor),f(Math.floor(info.origin[1])*factor)],
   [baselineX,f(baselineY-f(font.ascent*factor))]]){
   x1=f(x1+dx);x2=f(x2+dx);y1=f(y1+dy);y2=f(y2+dy);
  }
  const dx=f(x1-Math.floor(x1)),dy=f(y1-Math.floor(y1));
  return [{atlas:info.atlas,rect:{x1:f(x1-dx),y1:f(y1-dy),x2:f(x2-dx),y2:f(y2-dy)},
   uv:{x1:f(u1/atlas.width),y1:f(v1/atlas.height),x2:f(u2/atlas.width),y2:f(v2/atlas.height)}}];
 });
}
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'none',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
export function nativeUiTextLayers<T>(text:string,scale:1|2,baseline:{x:number;y:number},textures:readonly T[],tint:readonly[number,number,number,number]=[1,1,1,1],transform?:PresentationTransform):PresentationTextureLayer<T>[] {
 return nativeUiTextQuads(text,scale,baseline).map(({atlas,rect,uv})=>({texture:textures[atlas],rect,uv,tint,transform,alpha:'straight',colorSpace:'native-unorm',sampling}));
}
