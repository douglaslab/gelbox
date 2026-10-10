import type {Band, Rect} from '../sim/band';
import type {Mesh} from './mesh';

/** GelView::drawBands, the native scene when the Render checkbox is off. */
export function buildDirectBandMesh(bands: Band[]): Mesh {
  const data: number[] = [], f = Math.fround;
  type Color = [number,number,number,number];
  const gray = (v:number):Color => [v,v,v,1];
  const fill = (r:Rect,top:Color,bottom=top) => {
    const corners = [[r.x1,r.y1,...top],[r.x2,r.y1,...top],
      [r.x2,r.y2,...bottom],[r.x1,r.y2,...bottom]];
    for (const i of [0,1,2,2,3,0]) data.push(...corners[i]);
  };
  for (const band of bands) {
    const rect = {x1:f(band.rect.x1),y1:f(band.rect.y1),x2:f(band.rect.x2),y2:f(band.rect.y2)};
    const below=f(band.smearBelow),smearAbove=f(band.smearAbove),flame=f(band.flameHeight);
    const above=Math.max(flame,smearAbove),brightness=f(band.brightness);
    const color:Color=[...band.color,brightness];
    if (band.blur) {
      const blur=band.blur;
      fill({x1:f(rect.x1-blur),y1:f(f(rect.y1-above)-blur),
        x2:f(rect.x2+blur),y2:f(f(rect.y2+below)+blur)},[...band.color,f(brightness*f(.2))]);
    }
    fill(rect,color);
    if (below>0) fill({...rect,y1:rect.y2,y2:f(rect.y2+below)},
      gray(band.smearBrightnessBelow[0]),gray(band.smearBrightnessBelow[1]));
    if (above) {
      const r={...rect,y2:rect.y1,y1:f(rect.y1-above)};
      // Native intentionally reads Below here, despite drawing above the body.
      if (smearAbove>flame) fill(r,gray(band.smearBrightnessBelow[0]),gray(band.smearBrightnessBelow[1]));
      else fill(r,[...band.color,0],color);
    }
  }
  return {data:new Float32Array(data),vertexCount:data.length/6};
}
