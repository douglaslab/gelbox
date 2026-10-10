import {useLayoutEffect,useRef,type RefObject} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {acquireSceneAsset} from '../../lib/gel/sceneAssets';
import {resolveAssetUrl} from '../../lib/layout/assets';
import {sliderPaint,type SliderPaintInput} from '../../lib/gel/sliderPaint';
import type {SliderConfig} from '../../lib/slider/slider';

/** Ordered paint for native sliders; the existing DOM retains picking. */
export function SliderScenePaint({element,viewKey,order,config,normalized,iconLo,iconHi,iconSize,iconGutter,graphValues,label,barHeight,barRadius,barColors}:{
 element:RefObject<HTMLDivElement>;viewKey:string;order:number;config:SliderConfig;normalized:number;
 iconLo?:string;iconHi?:string;iconSize:{x:number;y:number};iconGutter:number;graphValues?:number[];label?:string;barHeight:number;barRadius:number;barColors:Pick<SliderPaintInput,'fill'|'empty'|'textColor'>;
}){
 const registry=useSharedPresentation(),scale=(window.devicePixelRatio||1)>=2?2:1;
 const urls=[iconLo?resolveAssetUrl(iconLo):null,iconHi?resolveAssetUrl(iconHi):null];
 const fontUrl=resolveAssetUrl('/assets/native-text/ui-font-0.png');
 const current=useRef({config,normalized,iconSize,iconGutter,graphValues,label,barHeight,barRadius,barColors});current.current={config,normalized,iconSize,iconGutter,graphValues,label,barHeight,barRadius,barColors};
 const assets=useRef<{icons:(ReturnType<typeof acquireSceneAsset>|null)[];font:ReturnType<typeof acquireSceneAsset>}|null>(null);
 useLayoutEffect(()=>{
  if(!registry)return;
  const owned={icons:urls.map(url=>url?acquireSceneAsset(registry,url,!url.includes('/assets/native-text/')):null),font:acquireSceneAsset(registry,fontUrl,false)};assets.current=owned;
  return()=>{if(assets.current===owned)assets.current=null;owned.icons.forEach(a=>a?.release());owned.font.release();element.current?.removeAttribute('data-shared-ready');};
 },[registry,urls[0],urls[1],fontUrl,element]);
 useLayoutEffect(()=>registry?.register(viewKey,()=>{
  const el=element.current,owned=assets.current;if(!el||!owned)return [];
  const graphics=registry.getGraphics(),icons=owned.icons.map(a=>a?.texture(graphics)??null),font=owned.font.texture(graphics);
  if(!font||icons.some((texture,i)=>owned.icons[i]&&!texture))return [];
  const images=[0,1].map(i=>el.querySelector<HTMLImageElement>(`[data-slider-icon="${i}"]`));
  if(images.some(image=>image&&!image.naturalWidth))return [];
  const imageSize=(image:HTMLImageElement|null)=>{const factor=image?.currentSrc.includes('@2x.')?2:1;return {x:Math.trunc((image?.naturalWidth??0)/factor),y:Math.trunc((image?.naturalHeight??0)/factor)};};
  const sizes:SliderPaintInput['naturalIcons']=[imageSize(images[0]),imageSize(images[1])];
  const p=current.current,r=el.getBoundingClientRect();
  const highlighted=images.findIndex(image=>image?.dataset.highlighted==='true');
  const input:SliderPaintInput={style:p.config.style,value:p.normalized,enabled:p.config.enabled!==false,width:r.width,iconGutter:p.iconGutter,iconSize:p.iconSize,naturalIcons:sizes,
   barSize:{x:r.width,y:p.barHeight},barGutter:p.iconGutter,barRadius:p.barRadius,fill:p.barColors.fill,empty:p.barColors.empty,iconMipmaps:urls.map(url=>!url?.includes('/assets/native-text/')),
   notches:p.config.notchAction&&p.config.notchAction!=='none'?p.config.notches??[]:[],graph:p.graphValues??[],label:p.label??'',textColor:p.config.style==='bar'?p.barColors.textColor:[0,0,0,1],highlight:highlighted};
  el.dataset.sharedReady='1';
  return sliderPaint(input,icons,[font],scale).map(command=>({...command,transform:[1,0,0,1,r.left,r.top] as const}));
 },order),[registry,viewKey,order,element,scale,urls[0],urls[1]]);
 return null;
}
