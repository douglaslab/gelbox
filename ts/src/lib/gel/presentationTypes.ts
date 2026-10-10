/** Presentation geometry uses physical pixels; wells remain in gel units. */
export interface PresentationSize { width:number; height:number }
export interface WellRect { x1:number; y1:number; x2:number; y2:number }

export function wellVertices(wells:readonly WellRect[],scale:number):Float32Array {
  const data=new Float32Array(wells.length*10);
  wells.forEach(({x1,y1,x2,y2},i)=>data.set(
    [x1,y1,x2,y1,x2,y2,x1,y2,x1,y1].map(value=>value*scale),i*10));
  return data;
}

export function validatePresentationSize({width,height}:PresentationSize):void {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
    throw new Error('Gel presentation requires positive integer pixel dimensions');
}
