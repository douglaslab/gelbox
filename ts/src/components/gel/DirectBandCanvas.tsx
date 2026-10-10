import {useEffect,useRef} from 'react';
import type {Band} from '../../lib/sim/band';
import {buildDirectBandMesh} from '../../lib/gel/directBands';
import {selectBackend} from '../../lib/gel/backend';

/** Native drawBands renders directly at window resolution, without gel effects. */
export function DirectBandCanvas({bands,gelSize}:{bands:Band[];gelSize:{width:number;height:number}}) {
  const canvasRef=useRef<HTMLCanvasElement>(null),latest=useRef(bands),drawRef=useRef<(()=>void)|null>(null);
  latest.current=bands;
  useEffect(()=>{
    const canvas=canvasRef.current!;
    let cancelled=false,dispose=()=>{},draw=()=>{};
    const resize=()=>{
      const dpr=window.devicePixelRatio||1;
      const width=Math.max(1,Math.round(gelSize.width*dpr)),height=Math.max(1,Math.round(gelSize.height*dpr));
      if(canvas.width!==width)canvas.width=width;
      if(canvas.height!==height)canvas.height=height;
      draw();
    };
    let resolution=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onResolution=()=>{
      resolution.removeEventListener('change',onResolution);
      resolution=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener('change',onResolution);resize();
    };
    resolution.addEventListener('change',onResolution);
    window.addEventListener('resize',resize);resize();
    void(async()=>{
      try {
        if(selectBackend()==='webgl2') {
          const [{configureGl2Context},{createGlMeshBatch}]=await Promise.all([
            import('../../lib/gpu/gl/context'),import('../../lib/gpu/gl/meshBatch')]);
          if(cancelled)return;
          const {gl}=configureGl2Context(canvas);
          const batch=createGlMeshBatch(gl,{viewport:gelSize,blend:'additive'});
          dispose=()=>batch.destroy();
          draw=()=>batch.draw({framebuffer:null,width:canvas.width,height:canvas.height},buildDirectBandMesh(latest.current),{clear:true,clearColor:[0,0,0,1]});
        } else {
          const [{requestDevice},{configureContext},{createMeshBatch}]=await Promise.all([
            import('../../lib/gpu/device'),import('../../lib/gpu/context'),import('../../lib/gpu/meshBatch')]);
          if(cancelled)return;
          const {device}=await requestDevice();
          if(cancelled)return;
          const {context,format}=configureContext(canvas,device);
          dispose=()=>context.unconfigure();
          const batch=createMeshBatch(device,{viewport:gelSize,blend:'additive',format});
          dispose=()=>{batch.destroy();context.unconfigure();};
          draw=()=>{
            const encoder=device.createCommandEncoder();
            batch.draw(encoder,context.getCurrentTexture().createView(),buildDirectBandMesh(latest.current),{clear:true,clearColor:{r:0,g:0,b:0,a:1},callIdx:0});
            device.queue.submit([encoder.finish()]);
          };
        }
        drawRef.current=draw;resize();
      }catch(error){if(!cancelled)console.error('DirectBandCanvas mount failed:',error);}
    })();
    return()=>{
      cancelled=true;drawRef.current=null;
      window.removeEventListener('resize',resize);resolution.removeEventListener('change',onResolution);dispose();
    };
  },[gelSize.width,gelSize.height]);
  useEffect(()=>{drawRef.current?.();},[bands]);
  return <canvas ref={canvasRef} data-testid="gel-canvas" data-render-mode="direct" style={{width:gelSize.width,height:gelSize.height,display:'block',border:0}}/>;
}
