import type {PresentationLayer} from './presentationTypes';
/** SampleView::draw: inset two-unit focus stroke followed by a physical GL line. */
export function sampleFrame(width:number,height:number,focused:boolean,hover:boolean):PresentationLayer[]{
 const layers:PresentationLayer[]=[];
 if(focused){
  // Cinder drawStrokedRect(bounds.inflated(-1),2), preserving strip triangle order.
  const a=2,b=width-2,c=width,d=height-2,e=height;
  const points=[[a,d],[a,a],[0,e],[0,0],[a,a],[b,a],[0,0],[c,0],[b,a],[b,d],[c,0],[c,e],[b,d],[a,d],[c,e],[0,e]];
  const triangles=points.slice(2).flatMap((p,i)=>i%2?[points[i+1],points[i],p]:[points[i],points[i+1],p]);
  layers.push({mesh:{data:new Float32Array(triangles.flatMap(p=>[...p,0,0,1,.1])),vertexCount:triangles.length}});
 }
 const gray=focused||hover ? .4 : .8;
 layers.push({mesh:{data:new Float32Array([[0,0],[width,0],[width,height],[0,height],[0,0]].flatMap(p=>[...p,gray,gray,gray,1])),vertexCount:5},topology:'line-strip'});
 return layers;
}
