import {useEffect,useRef} from 'react';
import type {Band} from '../../lib/sim/band';
import type {WellRect} from '../../lib/gel/presentationTypes';
import {buildDirectBandMesh} from '../../lib/gel/directBands';
import {resolveBackend,type Backend} from '../../lib/gel/backend';
import {useRendererRecovery} from '../../lib/gpu/useRendererRecovery';
import {watchDeviceLoss,watchDeviceErrors,watchGlLoss} from '../../lib/gpu/loss';
import {GraphicsFailure} from '../primitives/GraphicsFailure';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';

/** Native drawBands skips gel effects; wells still use native window presentation. */
export function DirectBandCanvas({bands,gelSize,wells=[]}:{bands:Band[];gelSize:{width:number;height:number};wells?:readonly WellRect[]}) {
  const {failed,attempt,forcedBackend,onFailure,onLoss,onSuccess,onRetry}=useRendererRecovery();
  const dpr=useDisplayScale();
  const canvasRef=useRef<HTMLCanvasElement>(null),latest=useRef({bands,wells}),drawRef=useRef<(()=>void)|null>(null);
  latest.current={bands,wells};
  useEffect(()=>{
    const canvas=canvasRef.current!;let cancelled=false,lost=false;
    const cleanup:Array<()=>void>=[];
    const dispose=()=>{drawRef.current=null;for(const release of cleanup.splice(0).reverse())release();};
    const handleLoss=(backend:Backend,restartCycle=true)=>{
      if(cancelled||lost)return;lost=true;dispose();
      if(restartCycle)onLoss(backend);else onFailure(backend);
    };
    canvas.width=Math.max(1,Math.round(gelSize.width*dpr));canvas.height=Math.max(1,Math.round(gelSize.height*dpr));
    const size={width:canvas.width,height:canvas.height};
    void(async()=>{
      let backend:Backend|null=null;
      try{
        backend=forcedBackend??await resolveBackend();if(cancelled||lost)return;
        let draw:()=>void;
        if(backend==='webgl2'){
          const [{configureGl2Context},{createGlGelPresentation}]=await Promise.all([
            import('../../lib/gpu/gl/context'),import('../../lib/gel/present-gl')]);
          if(cancelled||lost)return;
          const {gl}=configureGl2Context(canvas);cleanup.push(watchGlLoss(canvas,()=>handleLoss('webgl2')));cleanup.push(()=>{if(lost||!canvas.isConnected)gl.getExtension('WEBGL_lose_context')?.loseContext();});
          const presentation=createGlGelPresentation(gl,size);cleanup.push(()=>presentation.destroy());
          draw=()=>{presentation.draw({mesh:buildDirectBandMesh(latest.current.bands)},latest.current.wells,dpr);};
        }else{
          const [{requestDevice},{configureContext},{createGelPresentation}]=await Promise.all([
            import('../../lib/gpu/device'),import('../../lib/gpu/context'),import('../../lib/gel/present')]);
          if(cancelled||lost)return;const {device}=await requestDevice();if(cancelled||lost)return;
          cleanup.push(watchDeviceLoss(device,()=>handleLoss('webgpu')));cleanup.push(watchDeviceErrors(device,()=>handleLoss('webgpu',false)));
          const {context,format}=configureContext(canvas,device);cleanup.push(()=>context.unconfigure());
          const presentation=createGelPresentation(device,format,size);cleanup.push(()=>presentation.destroy());
          draw=()=>{const encoder=device.createCommandEncoder();presentation.draw(encoder,{mesh:buildDirectBandMesh(latest.current.bands)},context.getCurrentTexture().createView(),latest.current.wells,dpr);device.queue.submit([encoder.finish()]);};
        }
        drawRef.current=()=>{if(cancelled||lost)return;try{draw();}catch(error){console.error('Direct gel frame failed:',error);handleLoss(backend!,false);}};
        drawRef.current();if(!cancelled&&!lost)onSuccess();
      }catch(error){if(!cancelled&&!lost){console.error('DirectBandCanvas mount failed:',error);lost=true;dispose();onFailure(backend);}}
    })();
    return()=>{cancelled=true;dispose();};
  },[gelSize.width,gelSize.height,dpr,attempt,forcedBackend,onFailure,onLoss,onSuccess]);
  useEffect(()=>{drawRef.current?.();},[bands,wells]);
  return <><canvas key={attempt} ref={canvasRef} data-testid="gel-canvas" data-render-mode="direct" style={{width:gelSize.width,height:gelSize.height,display:'block',border:0}}/>
    {failed&&<GraphicsFailure testId="gel-canvas-error" width={gelSize.width} height={gelSize.height} onRetry={onRetry}/>}</>;
}
