import {it,expect,vi} from 'vitest';
import {ReferenceImageStore,isReferenceImage} from '../../src/lib/gel/referenceImages';
const bitmap=()=>({width:200,height:100,close:vi.fn()}) as unknown as ImageBitmap;
const file={name:'test.png'} as File;
it('retains natural image, centers drop, updates frame, and closes once on removal',async()=>{
 const b=bitmap(),store=new ReferenceImageStore(async()=>b),changed=vi.fn();store.subscribe(changed);
 await store.load(file,{x:150,y:120});const [entry]=store.getSnapshot();
 expect(entry.frame).toEqual({x1:50,y1:70,x2:250,y2:170});expect(entry.bitmap).toBe(b);
 store.update(entry.id,{x1:0,y1:0,x2:100,y2:50});expect(store.getSnapshot()[0].frame.x1).toBe(0);
 store.remove(entry.id);store.remove(entry.id);store.dispose();expect(b.close).toHaveBeenCalledTimes(1);expect(changed).toHaveBeenCalled();
});
it('load without drop starts at origin; failures retain current images',async()=>{
 const b=bitmap(),decode=vi.fn().mockResolvedValueOnce(b).mockRejectedValueOnce(new Error('bad image'));
 const store=new ReferenceImageStore(decode);await store.load(file);
 expect(store.getSnapshot()[0].frame).toEqual({x1:0,y1:0,x2:200,y2:100});
 await expect(store.load(file)).rejects.toThrow('bad image');expect(store.getSnapshot()).toHaveLength(1);
 store.dispose();expect(b.close).toHaveBeenCalledTimes(1);
});
it('late completion after dispose/reactivation closes old bitmap and cannot add stale view',async()=>{
 let finish!:(b:ImageBitmap)=>void;const b=bitmap();
 const store=new ReferenceImageStore(()=>new Promise(resolve=>{finish=resolve;}));
 const pending=store.load(file);store.dispose();store.activate();finish(b);await pending;
 expect(store.getSnapshot()).toHaveLength(0);expect(b.close).toHaveBeenCalledTimes(1);
});
it('accepts exactly native image extensions, independently of MIME',()=>{
 for(const n of ['a.jpg','a.png','a.gif'])expect(isReferenceImage(n)).toBe(true);
 for(const n of ['a.jpeg','a.PNG','a.svg','a.png.json','png'])expect(isReferenceImage(n)).toBe(false);
});
