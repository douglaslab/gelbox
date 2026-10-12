import {createContext,useContext,useEffect,useRef,type ReactNode} from 'react';
import {ScenePresentationRegistry,type SceneGraphics,type SharedScene} from '../../lib/gel/scenePresentation';
import {resolveBackend,type Backend} from '../../lib/gel/backend';
import {useRendererRecovery} from '../../lib/gpu/useRendererRecovery';
import {watchDeviceErrors,watchDeviceLoss,watchGlLoss} from '../../lib/gpu/loss';
import {GraphicsFailure} from '../primitives/GraphicsFailure';
const Context=createContext<ScenePresentationRegistry|null>(null);
export const useSharedPresentation=()=>useContext(Context);
export function ScenePresentationProvider({registry,children}:{registry:ScenePresentationRegistry|null;children:ReactNode}){
 return <Context.Provider value={registry}>{registry&&<SceneCanvas registry={registry}/>}{children}</Context.Provider>;
}
function SceneCanvas({registry}:{registry:ScenePresentationRegistry}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const {failed,attempt,forcedBackend,onFailure,onLoss,onSuccess,onRetry}=useRendererRecovery();
 useEffect(()=>{
  const canvas=canvasRef.current!;let cancelled=false,lost=false;
  const cleanup:(()=>void)[]=[];
  const dispose=()=>{for(const release of cleanup.splice(0).reverse())release();};
  const fail=(backend:Backend,recover=false)=>{if(cancelled||lost)return;lost=true;dispose();if(recover)onLoss(backend);else onFailure(backend);};
  void(async()=>{
   let backend:Backend|null=null;
   try{
    backend=forcedBackend??await resolveBackend();if(cancelled||lost)return;
    let draw:(scene:SharedScene,scale:number)=>void;
    let graphics:SceneGraphics;
    if(backend==='webgl2'){
     const [{configureGl2Context},{createGlGelPresentation}]=await Promise.all([import('../../lib/gpu/gl/context'),import('../../lib/gel/present-gl')]);
     if(cancelled||lost)return;
     const {gl}=configureGl2Context(canvas);
     cleanup.push(()=>gl.getExtension('WEBGL_lose_context')?.loseContext());
     cleanup.push(watchGlLoss(canvas,()=>fail('webgl2',true)));
     let presentation:ReturnType<typeof createGlGelPresentation>|undefined,w=0,h=0,logicalW=0,logicalH=0;
     cleanup.push(()=>presentation?.destroy());
     graphics={backend:'webgl2',gl,fail:error=>{console.error('Shared GL resource failed:',error);fail('webgl2');}};
     draw=(scene,scale)=>{
      if(w!==canvas.width||h!==canvas.height||logicalW!==window.innerWidth||logicalH!==window.innerHeight){presentation?.destroy();presentation=undefined;w=canvas.width;h=canvas.height;logicalW=window.innerWidth;logicalH=window.innerHeight;presentation=createGlGelPresentation(gl,{width:w,height:h},{windowSize:{width:logicalW,height:logicalH}});}
      presentation!.draw({...scene,commands:scene.commands.map(op=>{if(!('texture' in op))return op;if(op.texture.backend!=='webgl2')throw Error('Texture belongs to a different backend');return {...op,texture:op.texture.value};})},[],scale);
     };
    }else{
     const [{requestDevice},{configureContext},{createGelPresentation}]=await Promise.all([import('../../lib/gpu/device'),import('../../lib/gpu/context'),import('../../lib/gel/present')]);
     if(cancelled||lost)return;
     const {device}=await requestDevice();if(cancelled||lost)return;
     cleanup.push(watchDeviceLoss(device,()=>fail('webgpu',true)));cleanup.push(watchDeviceErrors(device,()=>fail('webgpu')));
     const {context,format}=configureContext(canvas,device);cleanup.push(()=>context.unconfigure());
     let presentation:ReturnType<typeof createGelPresentation>|undefined,w=0,h=0,logicalW=0,logicalH=0;
     cleanup.push(()=>presentation?.destroy());
     graphics={backend:'webgpu',device,fail:error=>{console.error('Shared GPU resource failed:',error);fail('webgpu');}};
     draw=(scene,scale)=>{
      if(w!==canvas.width||h!==canvas.height||logicalW!==window.innerWidth||logicalH!==window.innerHeight){presentation?.destroy();presentation=undefined;w=canvas.width;h=canvas.height;logicalW=window.innerWidth;logicalH=window.innerHeight;presentation=createGelPresentation(device,format,{width:w,height:h},{windowSize:{width:logicalW,height:logicalH}});}
      const encoder=device.createCommandEncoder({label:'shared-scene'});
      presentation!.draw(encoder,{...scene,commands:scene.commands.map(op=>{if(!('texture' in op))return op;if(op.texture.backend!=='webgpu')throw Error('Texture belongs to a different backend');return {...op,texture:op.texture.value};})},context.getCurrentTexture().createView(),[],scale);device.queue.submit([encoder.finish()]);
     };
    }
    cleanup.push(registry.connect(graphics));
    cleanup.push(registry.subscribe((scene,keys)=>{
     if(cancelled||lost)return;
     try{
      const scale=window.devicePixelRatio||1,w=Math.max(1,Math.round(window.innerWidth*scale)),h=Math.max(1,Math.round(window.innerHeight*scale));
      if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
      draw(scene,scale);canvas.dataset.viewKeys=keys.join(',');
     }catch(error){console.error('Shared scene failed:',error);fail(backend!);}
    },error=>{console.error('Shared scene collection failed:',error);fail(backend!);}));
    onSuccess();
   }catch(error){if(!cancelled&&!lost){console.error('Shared scene initialization failed:',error);if(backend)fail(backend);else{dispose();onFailure(null);}}}
  })();
  return()=>{cancelled=true;dispose();};
 },[registry,attempt,forcedBackend,onFailure,onLoss,onSuccess]);
 return <><canvas key={attempt} ref={canvasRef} data-testid="shared-scene" aria-hidden
  style={{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:0,pointerEvents:'none'}}/>
  {failed&&<div style={{position:'fixed',inset:0,zIndex:1000}}><GraphicsFailure testId="shared-scene-error" width={window.innerWidth} height={window.innerHeight} onRetry={onRetry}/></div>}</>;
}
