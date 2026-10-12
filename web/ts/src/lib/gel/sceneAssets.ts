import {createSceneImageTexture,type SceneImageTexture} from './sceneImageTexture';
import type {SceneGraphics,ScenePresentationRegistry,SceneTexture} from './scenePresentation';
interface Entry {users:number;bitmap:ImageBitmap|null;error:unknown;errorOn:SceneGraphics|null;abort:AbortController;graphics:SceneGraphics|null;resource:SceneImageTexture|null;release?:()=>void}
const caches=new WeakMap<ScenePresentationRegistry,Map<string,Entry>>();
/** Native Layout caches UI images by resolved asset path. Keep that ownership
 * separate from document images, with backend resources retired by the scene. */
export function acquireSceneAsset(registry:ScenePresentationRegistry,url:string,mipmaps=true){
 let cache=caches.get(registry);if(!cache){cache=new Map();caches.set(registry,cache);}
 const key=`${mipmaps?'mips':'single'}:${url}`;
 let entry=cache.get(key);
 if(!entry){
  entry={users:0,bitmap:null,error:null,errorOn:null,abort:new AbortController(),graphics:null,resource:null};cache.set(key,entry);
  load(entry,url);
 }
 entry.users++;const target=entry;let live=true;
 return {
  texture(graphics:SceneGraphics|null):SceneTexture|null{
   if(!live||!graphics)return null;
   if(target.error){
    if(!target.errorOn){target.errorOn=graphics;throw target.error;}
    if(target.errorOn===graphics)throw target.error;
    // A new graphics connection represents fallback or explicit retry.
    // Do not repeatedly fetch a failed asset from every animation frame.
    load(target,url);
   }
   if(!target.bitmap)return null;
   if(!target.resource||target.graphics!==graphics){
    target.release?.();const resource=createSceneImageTexture(graphics,target.bitmap,'scene-asset',mipmaps);
    target.resource=resource;target.graphics=graphics;
    target.release=registry.own(graphics,()=>{resource.destroy();if(target.resource===resource){target.resource=null;target.graphics=null;}});
   }
   return target.resource?.texture??null;
  },
  release(){if(!live)return;live=false;if(--target.users)return;cache!.delete(key);target.abort.abort();target.release?.();target.bitmap?.close();target.bitmap=null;},
 };
}

function load(target:Entry,url:string){
 target.error=null;target.errorOn=null;
 void(async()=>{try{
   const decode=async(path:string)=>{
    const response=await fetch(path,{signal:target.abort.signal});
    if(!response.ok)throw Error(`Could not load UI image: ${path}`);
    return createImageBitmap(await response.blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none',imageOrientation:'none'});
   };
   let bitmap:ImageBitmap;
   try{bitmap=await decode(url);}catch(error){
    // Native Layout falls back after any failed load, including invalid image
    // data from a successful response (for example an SPA fallback document).
    if(target.abort.signal.aborted||!url.includes('@2x.'))throw error;
    bitmap=await decode(url.replace('@2x.','.'));
   }
   if(!target.users){bitmap.close();return;}target.bitmap=bitmap;
  }catch(error){if(target.users)target.error=error;}})();
}
