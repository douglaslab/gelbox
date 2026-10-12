import {expect,it} from 'vitest';
import {ScenePresentationRegistry,nativeViewScissor} from '../../src/lib/gel/scenePresentation';
const frame={width:800,height:600,scale:2};
const op=(x:number)=>({mesh:{data:new Float32Array([x,0,1,1,1,1]),vertexCount:1}});
it('collects only current view keys, in current view and local paint order',()=>{
 const registry=new ScenePresentationRegistry();let position=1;
 registry.register('fragment',()=>[op(position)],2);
 const remove=registry.register('sample',()=>[op(2)]);
 registry.register('fragment',()=>[op(3)],1);
 registry.register('absent',()=>{throw Error('stale view must not draw');});
 expect(registry.collect(['sample','fragment'],frame).commands.map(c=>c.mesh.data[0])).toEqual([2,3,1]);
 position=4;remove();remove();
 expect(registry.collect(['fragment','sample'],frame).commands.map(c=>c.mesh.data[0])).toEqual([3,4]);
});
it('presentation observers read each committed frame and can retire independently',()=>{
 const registry=new ScenePresentationRegistry();const calls:number[]=[];
 registry.register('sample',f=>[op(f.width)]);
 const remove=registry.subscribe(scene=>calls.push(scene.commands[0].mesh.data[0]));
 registry.present(['sample'],frame);remove();registry.present(['sample'],{...frame,width:900});
 expect(calls).toEqual([800]);
});
it('converts native bottom-left float origins and truncated sizes before top-left reflection',()=>{
 expect(nativeViewScissor({left:10.75,top:20.25,width:30.75,height:40.75},100,2)).toEqual({x:21,y:42,width:60,height:80});
 expect(nativeViewScissor({left:-2.75,top:-1.25,width:10.5,height:9.5},100,1)).toEqual({x:-2,y:0,width:10,height:9});
});
it('retires resources once before notifying a replacement graphics connection',()=>{
 const registry=new ScenePresentationRegistry(),calls:string[]=[];
 const a={backend:'webgl2' as const,gl:{} as WebGL2RenderingContext,fail:()=>{}},b={...a};
 const stop=registry.connect(a);
 const release=registry.own(a,()=>calls.push('destroy-a'));
 registry.subscribeGraphics(()=>calls.push(registry.getGraphics()===b?'connected-b':'disconnected'));
 registry.connect(b);release();stop();
 expect(calls).toEqual(['destroy-a','connected-b']);expect(registry.getGraphics()).toBe(b);
 registry.own(a,()=>calls.push('stale'));expect(calls.at(-1)).toBe('stale');
});
