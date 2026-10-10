import {useEffect,useLayoutEffect,useRef,useSyncExternalStore,type RefObject} from 'react';
import type {ReferenceImage} from '../../lib/gel/referenceImages';
import {solidSceneRect,type ScenePresentationRegistry} from '../../lib/gel/scenePresentation';
import type {SceneImageTexture} from '../../lib/gel/sceneImageTexture';
import type {PresentationLayer,PresentationSampling} from '../../lib/gel/presentationTypes';
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
function outline(x1:number,y1:number,x2:number,y2:number,color:number[]):PresentationLayer {
 return {mesh:{data:new Float32Array([[x1,y1],[x2,y1],[x2,y2],[x1,y2],[x1,y1]].flatMap(p=>[...p,...color])),vertexCount:5},topology:'line-strip'};
}
export function SharedReferenceImage({registry,image,root,canvas}:{registry:ScenePresentationRegistry;image:ReferenceImage;root:RefObject<HTMLDivElement>;canvas:RefObject<HTMLCanvasElement>}){
 const graphics=useSyncExternalStore(registry.subscribeGraphics,registry.getGraphics),owner=useRef<SceneImageTexture|null>(null);
 const latest=useRef(image);latest.current=image;
 useEffect(()=>{
  if(!graphics)return;let cancelled=false,release:(()=>void)|undefined;
  void(async()=>{try{
   const {createSceneImageTexture}=await import('../../lib/gel/sceneImageTexture');
   if(cancelled||registry.getGraphics()!==graphics)return;
   const resource=createSceneImageTexture(graphics,image.bitmap);owner.current=resource;
   release=registry.own(graphics,()=>{if(owner.current===resource)owner.current=null;resource.destroy();canvas.current?.removeAttribute('data-shared-ready');});
  }catch(error){if(!cancelled&&registry.getGraphics()===graphics)graphics.fail(error);}})();
  return()=>{cancelled=true;release?.();};
 },[registry,graphics,image.bitmap,canvas]);
 useLayoutEffect(()=>registry.register(`image-${image.id}`,()=>{
  const resource=owner.current;if(!resource)return [];
  const {x1,y1,x2,y2}=latest.current.frame;
  const frame:PresentationLayer[]=[solidSceneRect(x2-16,y2-16,x2,y2,[.75,.75,.75]),outline(x2-16,y2-16,x2,y2,[.35,.35,.35,1])];
  if(root.current?.contains(document.activeElement)){
   // Native drawFrame uses getFrame().inflated(2), line width4: outside only.
   const points=[[x1,y2],[x1,y1],[x1-4,y2+4],[x1-4,y1-4],[x1,y1],[x2,y1],[x1-4,y1-4],[x2+4,y1-4],[x2,y1],[x2,y2],[x2+4,y1-4],[x2+4,y2+4],[x2,y2],[x1,y2],[x2+4,y2+4],[x1-4,y2+4]];
   const tris=points.slice(2).flatMap((p,i)=>i%2?[points[i+1],points[i],p]:[points[i],points[i+1],p]);
   frame.push({mesh:{data:new Float32Array(tris.flatMap(p=>[...p,1,1,.5,1])),vertexCount:tris.length}});
  }
  if(canvas.current)canvas.current.dataset.sharedReady='1';
  return [{texture:resource.texture,rect:{x1,y1,x2,y2},alpha:'straight' as const,colorSpace:'native-unorm' as const,sampling},...frame];
 }),[registry,image.id,root,canvas]);
 return null;
}
