import {useEffect,useRef} from 'react';
import type {Band} from '../../lib/sim/band';
import type {WellRect} from '../../lib/gel/presentationTypes';
import {buildDirectBandMesh} from '../../lib/gel/directBands';
import {selectBackend} from '../../lib/gel/backend';
import {useDisplayScale} from '../../lib/gpu/useDisplayScale';

/** Native drawBands skips gel effects; wells still use native window presentation. */
export function DirectBandCanvas({bands,gelSize,wells=[]}:{bands:Band[];gelSize:{width:number;height:number};wells?:readonly WellRect[]}) {
  const dpr=useDisplayScale();
  const canvasRef=useRef<HTMLCanvasElement>(null),latest=useRef({bands,wells}),drawRef=useRef<(()=>void)|null>(null);
  latest.current={bands,wells};
  useEffect(()=>{
    const canvas=canvasRef.current!;let cancelled=false;
    const cleanup:Array<()=>void>=[];
    canvas.width=Math.max(1,Math.round(gelSize.width*dpr));canvas.height=Math.max(1,Math.round(gelSize.height*dpr));
    const size={width:canvas.width,height:canvas.height};
    void(async()=>{
      try{
        let draw:()=>void;
        if(selectBackend()==='webgl2'){
          const [{configureGl2Context},{createGlMeshBatch},{createGlRenderTarget},{createGlGelPresentation}]=await Promise.all([
            import('../../lib/gpu/gl/context'),import('../../lib/gpu/gl/meshBatch'),import('../../lib/gpu/gl/target'),import('../../lib/gel/present-gl')]);
          if(cancelled)return;
          const {gl}=configureGl2Context(canvas);cleanup.push(()=>{if(!canvas.isConnected)gl.getExtension('WEBGL_lose_context')?.loseContext();});
          const batch=createGlMeshBatch(gl,{viewport:gelSize,blend:'additive'});cleanup.push(()=>batch.destroy());
          const target=createGlRenderTarget(gl,size.width,size.height,'direct-bands');cleanup.push(()=>target.destroy());
          const presentation=createGlGelPresentation(gl,size);cleanup.push(()=>presentation.destroy());
          draw=()=>{batch.draw(target,buildDirectBandMesh(latest.current.bands),{clear:true,clearColor:[0,0,0,1]});presentation.draw(target.texture,latest.current.wells,dpr);};
        }else{
          const [{requestDevice},{configureContext},{createMeshBatch},{createGelPresentation}]=await Promise.all([
            import('../../lib/gpu/device'),import('../../lib/gpu/context'),import('../../lib/gpu/meshBatch'),import('../../lib/gel/present')]);
          if(cancelled)return;const {device}=await requestDevice();if(cancelled)return;
          const {context,format}=configureContext(canvas,device);cleanup.push(()=>context.unconfigure());
          const batch=createMeshBatch(device,{viewport:gelSize,blend:'additive',format:'rgba8unorm'});cleanup.push(()=>batch.destroy());
          const target=device.createTexture({label:'direct-bands',size,format:'rgba8unorm',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});cleanup.push(()=>target.destroy());const view=target.createView();
          const presentation=createGelPresentation(device,format,size);cleanup.push(()=>presentation.destroy());
          draw=()=>{const encoder=device.createCommandEncoder();batch.draw(encoder,view,buildDirectBandMesh(latest.current.bands),{clear:true,clearColor:{r:0,g:0,b:0,a:1},callIdx:0});presentation.draw(encoder,view,context.getCurrentTexture().createView(),latest.current.wells,dpr);device.queue.submit([encoder.finish()]);};
        }
        drawRef.current=draw;draw();
      }catch(error){if(!cancelled)console.error('DirectBandCanvas mount failed:',error);}
    })();
    return()=>{cancelled=true;drawRef.current=null;for(const dispose of cleanup.reverse())dispose();};
  },[gelSize.width,gelSize.height,dpr]);
  useEffect(()=>{drawRef.current?.();},[bands,wells]);
  return <canvas ref={canvasRef} data-testid="gel-canvas" data-render-mode="direct" style={{width:gelSize.width,height:gelSize.height,display:'block',border:0}}/>;
}
