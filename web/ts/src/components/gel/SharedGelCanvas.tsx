import {useEffect,useLayoutEffect,useRef,useSyncExternalStore} from 'react';
import {nativeViewScissor,solidSceneRect,type SceneGraphics,type ScenePresentationRegistry,type SceneTexture} from '../../lib/gel/scenePresentation';
import type {PresentationCommand,PresentationLayer,PresentationSampling} from '../../lib/gel/presentationTypes';
import type {GelCanvasProps} from './GelCanvas';
const sampling:PresentationSampling={minFilter:'linear',magFilter:'linear',mipmapFilter:'none',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'};
type Renderer=ReturnType<typeof import('../../lib/gel/render').createGelRenderer>|ReturnType<typeof import('../../lib/gel/render-gl').createGlGelRenderer>;
interface Owner {graphics:SceneGraphics;renderer:Renderer;texture:()=>SceneTexture;bands:GelCanvasProps['bands']|null;warp:GelCanvasProps['globalWarp']|null}
/** Scientific FBOs are native too; only their final image moves onto the window surface. */
export function SharedGelCanvas({registry,bands,globalWarp,gelSize,pixelsPerUnit,wells}:GelCanvasProps&{registry:ScenePresentationRegistry}){
 const graphics=useSyncExternalStore(registry.subscribeGraphics,registry.getGraphics);
 const canvasRef=useRef<HTMLCanvasElement>(null),owner=useRef<Owner|null>(null);
 const latest=useRef({bands,globalWarp,wells});latest.current={bands,globalWarp,wells};
 useEffect(()=>{
  if(!graphics)return;
  let cancelled=false,release:(()=>void)|undefined;
  void(async()=>{
   try{
    let renderer:Renderer,texture:()=>SceneTexture;
    if(graphics.backend==='webgpu'){
     const {createGelRenderer}=await import('../../lib/gel/render');
     if(cancelled||registry.getGraphics()!==graphics)return;
     const gpu=createGelRenderer(graphics.device,gelSize,pixelsPerUnit);renderer=gpu;texture=()=>({backend:'webgpu',value:gpu.output.view});
    }else{
     const {createGlGelRenderer}=await import('../../lib/gel/render-gl');
     if(cancelled||registry.getGraphics()!==graphics)return;
     const gl=createGlGelRenderer(graphics.gl,gelSize,pixelsPerUnit);renderer=gl;texture=()=>({backend:'webgl2',value:gl.output.texture});
    }
    const value:Owner={graphics,renderer,texture,bands:null,warp:null};owner.current=value;
    release=registry.own(graphics,()=>{if(owner.current===value)owner.current=null;renderer.destroy();canvasRef.current?.removeAttribute('data-shared-ready');});
   }catch(error){if(!cancelled&&registry.getGraphics()===graphics)graphics.fail(error);}
  })();
  return()=>{cancelled=true;release?.();};
 },[registry,graphics,gelSize.width,gelSize.height,pixelsPerUnit]);
 useLayoutEffect(()=>registry.register('gel',frame=>{
  const canvas=canvasRef.current;if(!canvas)return [];
  const rect=canvas.getBoundingClientRect(),transform=[pixelsPerUnit,0,0,pixelsPerUnit,rect.left,rect.top] as const;
  const scissor=nativeViewScissor(rect,frame.height,frame.scale);
  const commands:PresentationCommand<SceneTexture>[]=[{...solidSceneRect(0,0,gelSize.width,gelSize.height,[0,0,0]),transform}];
  const value=owner.current;
  if(value&&value.graphics===registry.getGraphics()){
   if(value.bands!==latest.current.bands||value.warp!==latest.current.globalWarp){
    value.renderer.setBands(latest.current.bands);value.renderer.setGlobalWarp(latest.current.globalWarp);value.renderer.render();
    value.bands=latest.current.bands;value.warp=latest.current.globalWarp;
   }
   commands.push({texture:value.texture(),rect:{x1:0,y1:0,x2:gelSize.width,y2:gelSize.height},
    uv:value.graphics.backend==='webgl2'?{x1:0,y1:1,x2:1,y2:0}:undefined,
    alpha:'straight',colorSpace:'native-unorm',sampling,transform,scissor});
   canvas.dataset.sharedReady='1';
  }
  for(const {x1,y1,x2,y2} of latest.current.wells){
   const well:PresentationLayer={mesh:{data:new Float32Array([[x1,y1],[x2,y1],[x2,y2],[x1,y2],[x1,y1]].flatMap(p=>[...p,.8,.8,.8,.8])),vertexCount:5},topology:'line-strip',transform,scissor};commands.push(well);
  }
  return commands;
 }),[registry,gelSize.width,gelSize.height,pixelsPerUnit]);
 return <canvas ref={canvasRef} data-testid="gel-canvas" data-render-mode="effects" aria-hidden
  style={{width:gelSize.width*pixelsPerUnit,height:gelSize.height*pixelsPerUnit,display:'block',opacity:0}}/>;
}
