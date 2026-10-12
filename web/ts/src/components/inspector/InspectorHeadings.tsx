import {useLayoutEffect,useRef} from 'react';
import {useSharedPresentation} from '../gel/ScenePresentation';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {acquireSceneAsset} from '../../lib/gel/sceneAssets';
import {resolveAssetUrl} from '../../lib/layout/assets';
import nativeText from '../../lib/layout/nativeInspectorText.json';
import type {PresentationCommand,PresentationSampling} from '../../lib/gel/presentationTypes';
import type {SceneTexture} from '../../lib/gel/scenePresentation';
import {LAYOUT} from '../../lib/layout/layout';
export type InspectorHeadingKind='gel-settings'|'sample-settings'|'fragment';
interface HeadingScene {rule?:number[];textures:{id:string;rect:number[];size:number[];topDown:boolean}[]}
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'none',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
export function InspectorHeadings({kind}:{kind:InspectorHeadingKind}){
 const registry=useSharedPresentation(),element=useRef<HTMLDivElement>(null),scale=useDisplayScale()>=2?'2':'1';
 const scene:HeadingScene=nativeText[kind][scale];
 const assets=useRef<ReturnType<typeof acquireSceneAsset>[]>([]);
 useLayoutEffect(()=>{
  if(!registry)return;
  const owned=scene.textures.map(t=>acquireSceneAsset(registry,resolveAssetUrl(`/assets/native-text/${t.id}.png`),false));assets.current=owned;
  return()=>{if(assets.current===owned)assets.current=[];owned.forEach(asset=>asset.release());element.current?.removeAttribute('data-shared-ready');};
 },[registry,scene]);
 useLayoutEffect(()=>registry?.register(`inspector-${kind}`,()=>{
  const el=element.current;if(!el)return [];
  const r=el.getBoundingClientRect(),transform=[1,0,0,1,r.left,r.top] as const;
  const commands:PresentationCommand<SceneTexture>[]=[];
  if(scene.rule){
   const [x1,y1,x2,y2]=scene.rule,c=196/255;
   commands.push({mesh:{data:new Float32Array([x1,y1,c,c,c,1,x2,y2,c,c,c,1]),vertexCount:2},topology:'line-strip',transform});
  }
  let ready=0;
  scene.textures.forEach((t,i)=>{
   const texture=assets.current[i]?.texture(registry.getGraphics());if(!texture)return;
   const [x1,y1,x2,y2]=t.rect;
   commands.push({texture,rect:{x1,y1,x2,y2},transform,alpha:'straight',colorSpace:'native-unorm',sampling});ready++;
  });
  if(ready===scene.textures.length)el.dataset.sharedReady=`${kind}-${scale}`;
  return commands;
 },kind==='fragment'?50:-90),[registry,kind,scene,scale]);
 const heading=kind==='gel-settings'?{text:LAYOUT.gelSettingsHeaderStr,pos:LAYOUT.gelSettingsHeaderBaselinePos}:kind==='sample-settings'?{text:LAYOUT.sampleSettingsHeaderStr,pos:LAYOUT.sampleSettingsHeaderBaselinePos}:{text:LAYOUT.fragViewHeaderStr,pos:LAYOUT.fragViewHeaderBaselinePos};
 return <div ref={element} data-testid="inspector-headings" style={{opacity:registry?0:undefined,position:'absolute',inset:0,pointerEvents:'none'}}>
  <h2 style={{position:'absolute',left:heading.pos.x,top:heading.pos.y,margin:0,font:`${LAYOUT.headFontWeight} ${LAYOUT.headFontSize}px ${LAYOUT.headFont}`,color:LAYOUT.headFontColor,lineHeight:1}}>{heading.text}</h2>
  {kind==='gel-settings'&&<div data-testid="gel-settings-rule" style={{position:'absolute',left:LAYOUT.gelSettingsRuleTopLeft.x,top:LAYOUT.gelSettingsRuleTopLeft.y,width:LAYOUT.gelSettingsRuleLength,borderTop:`1px solid ${LAYOUT.ruleColor}`}}/>}
  {kind==='sample-settings'&&<div data-testid="sample-settings-dyes-label" style={{position:'absolute',left:LAYOUT.sampleSettingsSlidersTopLeft.x-90-8,top:LAYOUT.sampleSettingsSlidersTopLeft.y-LAYOUT.sampleSettingsSlidersToDyeLabel-LAYOUT.subheadFontSize,color:LAYOUT.subheadFontColor,font:`${LAYOUT.subheadFontWeight} ${LAYOUT.subheadFontSize}px ${LAYOUT.subheadFont}`}}>Dyes</div>}
 </div>;
}
