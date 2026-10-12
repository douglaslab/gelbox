import {useEffect,useLayoutEffect,useRef,type RefObject} from 'react';
import {acquireSceneAsset} from '../../lib/gel/sceneAssets';
import type {ScenePresentationRegistry} from '../../lib/gel/scenePresentation';
import type {PresentationSampling} from '../../lib/gel/presentationTypes';
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
export function SharedAssetPaint({registry,viewKey,element,url,tint=[1,1,1,1],order=0}:{registry:ScenePresentationRegistry;viewKey:string;element:RefObject<HTMLElement>;url:string;tint?:readonly[number,number,number,number];order?:number}){
 const asset=useRef<ReturnType<typeof acquireSceneAsset>|null>(null),color=useRef(tint);color.current=tint;
 useEffect(()=>{
  const owned=acquireSceneAsset(registry,url);asset.current=owned;
  return()=>{if(asset.current===owned)asset.current=null;owned.release();element.current?.removeAttribute('data-shared-ready');};
 },[registry,url,element]);
 useLayoutEffect(()=>registry.register(viewKey,()=>{
  const el=element.current,texture=asset.current?.texture(registry.getGraphics());if(!el||!texture)return [];
  const r=el.getBoundingClientRect();el.dataset.sharedReady='1';
  return [{texture,rect:{x1:r.left,y1:r.top,x2:r.right,y2:r.bottom},tint:color.current,alpha:'straight',colorSpace:'native-unorm',sampling}];
 },order),[registry,viewKey,element,order]);
 return null;
}
