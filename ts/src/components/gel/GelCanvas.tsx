import {watchDeviceLoss,watchDeviceErrors,watchGlLoss} from '../../lib/gpu/loss';
import {useRendererRecovery} from '../../lib/gpu/useRendererRecovery';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';
import {GraphicsFailure} from '../primitives/GraphicsFailure';
import {useEffect,useRef} from 'react';
import type {GlobalWarp} from '../../lib/sim/globalWarp';
import type {Band} from '../../lib/sim/band';
import type {WellRect} from '../../lib/gel/presentationTypes';
import {resolveBackend,type Backend} from '../../lib/gel/backend';

interface GelCanvasProps {
  bands:Band[];
  globalWarp:GlobalWarp;
  gelSize:{width:number;height:number};
  pixelsPerUnit:number;
  wells:readonly WellRect[];
}
type GpuRenderer=ReturnType<typeof import('../../lib/gel/render').createGelRenderer>;
type GlRenderer=ReturnType<typeof import('../../lib/gel/render-gl').createGlGelRenderer>;

export function GelCanvas({bands,globalWarp,gelSize,pixelsPerUnit,wells}:GelCanvasProps) {
  const {failed,attempt,forcedBackend,onFailure,onLoss,onSuccess,onRetry}=useRendererRecovery();
  const dpr=useDisplayScale();
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const stateRef=useRef<{
    failFrame:((error:unknown)=>void)|null;
    rendererGpu:GpuRenderer|null;
    rendererGl:GlRenderer|null;
    blitFn:(()=>void)|null;
  }>({failFrame:null,rendererGpu:null,rendererGl:null,blitFn:null});
  const latestSceneRef=useRef({bands,globalWarp,wells});
  latestSceneRef.current={bands,globalWarp,wells};

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    let cancelled=false,lost=false;
    const cleanup:Array<()=>void>=[];
    const dispose=()=>{
      stateRef.current.rendererGpu?.destroy();stateRef.current.rendererGl?.destroy();
      stateRef.current.rendererGpu=null;stateRef.current.rendererGl=null;stateRef.current.blitFn=null;stateRef.current.failFrame=null;
      for(const release of cleanup.splice(0).reverse())release();
    };
    const handleLoss=(backend:Backend,restartCycle=true)=>{
      if(cancelled||lost)return;lost=true;dispose();
      if(restartCycle)onLoss(backend);else onFailure(backend);
    };
    const scale=pixelsPerUnit*dpr;
    canvas.width=Math.max(1,Math.round(gelSize.width*scale));
    canvas.height=Math.max(1,Math.round(gelSize.height*scale));
    const size={width:canvas.width,height:canvas.height};
    void(async()=>{
      let backend:Backend|null=null;
      try{
        backend=forcedBackend??await resolveBackend();if(cancelled||lost)return;
        stateRef.current.failFrame=error=>{console.error('Gel frame failed:',error);handleLoss(backend!,false);};
        if(backend==='webgl2'){
          const {configureGl2Context}=await import('../../lib/gpu/gl/context');if(cancelled||lost)return;
          const {gl}=configureGl2Context(canvas);
          cleanup.push(watchGlLoss(canvas,()=>handleLoss('webgl2')));
          cleanup.push(()=>{if(lost||!canvas.isConnected)gl.getExtension('WEBGL_lose_context')?.loseContext();});
          const [{createGlGelRenderer},{createGlGelPresentation}]=await Promise.all([
            import('../../lib/gel/render-gl'),import('../../lib/gel/present-gl')]);
          if(cancelled||lost)return;
          const renderer=createGlGelRenderer(gl,gelSize,pixelsPerUnit);stateRef.current.rendererGl=renderer;
          const presentation=createGlGelPresentation(gl,size);cleanup.push(()=>presentation.destroy());
          stateRef.current.blitFn=()=>{
            presentation.draw(renderer.output.texture,latestSceneRef.current.wells,scale);
          };
          renderer.setBands(latestSceneRef.current.bands);renderer.setGlobalWarp(latestSceneRef.current.globalWarp);renderer.render();stateRef.current.blitFn();
        }else{
          const {requestDevice}=await import('../../lib/gpu/device');
          const {configureContext}=await import('../../lib/gpu/context');if(cancelled||lost)return;
          const {device,queue}=await requestDevice();if(cancelled||lost)return;
          cleanup.push(watchDeviceLoss(device,()=>handleLoss('webgpu')));
          cleanup.push(watchDeviceErrors(device,()=>handleLoss('webgpu',false)));
          const {context,format}=configureContext(canvas,device);cleanup.push(()=>context.unconfigure());
          const [{createGelRenderer},{createGelPresentation}]=await Promise.all([
            import('../../lib/gel/render'),import('../../lib/gel/present')]);
          if(cancelled||lost)return;
          const renderer=createGelRenderer(device,gelSize,pixelsPerUnit);stateRef.current.rendererGpu=renderer;
          const presentation=createGelPresentation(device,format,size);cleanup.push(()=>presentation.destroy());
          stateRef.current.blitFn=()=>{
            const enc = device.createCommandEncoder();
            presentation.draw(enc,renderer.output.view,context.getCurrentTexture().createView(),latestSceneRef.current.wells,scale);
            queue.submit([enc.finish()]);
          };
          renderer.setBands(latestSceneRef.current.bands);renderer.setGlobalWarp(latestSceneRef.current.globalWarp);renderer.render();stateRef.current.blitFn();
        }
        if(!cancelled&&!lost)onSuccess();
      }catch(error){if(!cancelled&&!lost){console.error('GelCanvas mount failed:',error);lost=true;dispose();onFailure(backend);}}
    })();
    return()=>{cancelled=true;dispose();};
  },[gelSize.width,gelSize.height,pixelsPerUnit,dpr,attempt,forcedBackend,onFailure,onLoss,onSuccess]);

  useEffect(()=>{
    const {rendererGpu,rendererGl,blitFn}=stateRef.current;const renderer=rendererGpu??rendererGl;
    if(!renderer||!blitFn)return;
    try{renderer.setBands(bands);renderer.setGlobalWarp(globalWarp);renderer.render();blitFn();}
    catch(error){stateRef.current.failFrame?.(error);}
  },[bands,globalWarp,wells]);

  return <>
    <canvas key={attempt} ref={canvasRef} data-testid="gel-canvas" data-render-mode="effects"
      style={{width:gelSize.width*pixelsPerUnit,height:gelSize.height*pixelsPerUnit,display:'block',border:0,imageRendering:'auto'}}/>
    {failed&&<GraphicsFailure testId="gel-canvas-error" width={gelSize.width*pixelsPerUnit} height={gelSize.height*pixelsPerUnit} onRetry={onRetry}/>}
  </>;
}
