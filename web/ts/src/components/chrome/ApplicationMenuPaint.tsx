import {useLayoutEffect,useRef,type RefObject} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {acquireSceneAsset} from '../../lib/gel/sceneAssets';
import {resolveAssetUrl} from '../../lib/layout/assets';
import {solidSceneRect,type SceneTexture} from '../../lib/gel/scenePresentation';
import {solidRoundedRect} from '../../lib/gel/fragmentWellGeometry';
import type {PresentationCommand,PresentationSampling} from '../../lib/gel/presentationTypes';
import text from '../../lib/layout/nativeMenuText.json';
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'none',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
export function ApplicationMenuPaint({element}:{element:RefObject<HTMLDivElement>}){
 const registry=useSharedPresentation(),scale=useDisplayScale()>=2?'2':'1',rows=text[scale];
 const assets=useRef<ReturnType<typeof acquireSceneAsset>[]>([]);
 useLayoutEffect(()=>{
  if(!registry)return;
  const owned=rows.map(row=>acquireSceneAsset(registry,resolveAssetUrl(`/assets/native-text/${row.id}-${scale}.png`),false));assets.current=owned;
  return()=>{if(assets.current===owned)assets.current=[];owned.forEach(a=>a.release());element.current?.removeAttribute('data-shared-ready');};
 },[registry,scale,element,rows]);
 useLayoutEffect(()=>registry?.register('app-settings',()=>{
  const el=element.current;if(!el)return [];
  const textures=assets.current.map(a=>a.texture(registry.getGraphics()));if(textures.length!==5||textures.some(t=>!t))return [];
  const commands:PresentationCommand<SceneTexture>[]=[];
  // Native child insertion is Render, Loupe, optional Sample, Save Gel, Open.
  for(const child of [...el.querySelectorAll<HTMLElement>('[data-menu-text]')].reverse()){
   const index=Number(child.dataset.menuText),row=index<2?rows[index]:text['1'][index],r=child.getBoundingClientRect(),transform=[1,0,0,1,r.left,r.top] as const;
   const down=child.dataset.menuDown==='true',hover=child.dataset.menuHover==='true';
   const part:PresentationCommand<SceneTexture>[]=[];
   let tint:readonly[number,number,number,number]=[1,1,1,1];
   if(index<2){
    const gray=151/255;
    part.push({mesh:{data:new Float32Array([[.5,.5],[15.5,.5],[15.5,15.5],[.5,15.5],[.5,.5]].flatMap(p=>[...p,gray,gray,gray,1])),vertexCount:5},topology:'line-strip'});
    const checked=child.querySelector('input')!.checked;
    if(checked!==down)part.push(solidSceneRect(2,2,14,14,[gray,gray,gray]));
   }else{
    const shade=down?.7:hover?.9:.95;
    part.push(solidRoundedRect({x1:0,y1:0,x2:row.rect[2],y2:row.rect[3]},2,[shade,shade,shade]));
    const t=down?.7:hover?.9:1;tint=[t,t,t,1];
   }
   const [x1,y1,x2,y2]=row.rect;
   part.push({texture:textures[index]!,rect:{x1,y1,x2,y2},tint,alpha:'straight',colorSpace:'native-unorm',sampling});
   commands.push(...part.map(p=>({...p,transform})));
  }
  el.dataset.sharedReady='menu';return commands;
 },0),[registry,scale,element,rows]);
 return null;
}
