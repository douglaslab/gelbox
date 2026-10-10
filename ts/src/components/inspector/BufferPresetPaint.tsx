import {useLayoutEffect,useRef,type RefObject} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {acquireSceneAsset} from '../../lib/gel/sceneAssets';
import {resolveAssetUrl} from '../../lib/layout/assets';
import {solidSceneRect,type SceneTexture} from '../../lib/gel/scenePresentation';
import {strokedRoundedRect} from '../../lib/gel/fragmentWellGeometry';
import type {PresentationCommand,PresentationSampling} from '../../lib/gel/presentationTypes';
import text from '../../lib/layout/nativeBufferText.json';
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'none',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
export function BufferPresetPaint({element,viewKey,order,selected,topLeft}:{element:RefObject<HTMLDivElement>;viewKey:string;order:number;selected:number;topLeft:{x:number;y:number}}){
 const registry=useSharedPresentation(),scale=useDisplayScale()>=2?'2':'1';
 const rows=text[scale].slice(0,4),current=useRef({selected,topLeft});current.current={selected,topLeft};
 const assets=useRef<ReturnType<typeof acquireSceneAsset>[]>([]);
 useLayoutEffect(()=>{
  if(!registry)return;
  const owned=text[scale].slice(0,4).map(t=>acquireSceneAsset(registry,resolveAssetUrl(`/assets/native-text/${t.id}.png`),false));assets.current=owned;
  return()=>{if(assets.current===owned)assets.current=[];owned.forEach(a=>a.release());element.current?.removeAttribute('data-shared-ready');};
 },[registry,scale,element]);
 useLayoutEffect(()=>registry?.register(viewKey,()=>{
  const el=element.current;if(!el)return [];
  const textures=assets.current.map(a=>a.texture(registry.getGraphics()));if(textures.length!==4||textures.some(t=>!t))return [];
  const r=el.getBoundingClientRect(),p=current.current,transform=[1,0,0,1,r.left+p.topLeft.x,r.top+p.topLeft.y] as const;
  const commands:PresentationCommand<SceneTexture>[]=[],f=Math.fround;
  const drawText=(i:number)=>{const [x1,y1,x2,y2]=rows[i].rect;commands.push({texture:textures[i]!,rect:{x1,y1,x2,y2},alpha:'straight',colorSpace:'native-unorm',sampling});};
  drawText(0);
  const rect={x1:66.5,y1:.5,x2:200.5,y2:22.5},width=f(134/3);
  for(let i=0;i<3;i++){
   if(i===p.selected){const x1=f(rect.x1+f(width*i));commands.push(solidSceneRect(x1,rect.y1,f(x1+width),rect.y2,[1,220/255,115/255]));}
   drawText(i+1);
  }
  const gray=151/255;
  commands.push(strokedRoundedRect(rect,5,[gray,gray,gray,1]));
  for(let i=1;i<3;i++){
   const x=f(rect.x1+f(134*f(i/3)));
   commands.push({mesh:{data:new Float32Array([x,.5,gray,gray,gray,1,x,22.5,gray,gray,gray,1]),vertexCount:2},topology:'line-list'});
  }
  el.dataset.sharedReady=`buffer-${scale}`;
  return commands.map(command=>({...command,transform}));
 },order),[registry,viewKey,order,scale,element]);
 return null;
}
