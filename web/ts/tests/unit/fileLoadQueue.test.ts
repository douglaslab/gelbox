import {expect,it} from 'vitest';
import {FileLoadQueue} from '../../src/lib/gel/fileLoadQueue';
it('preserves arrival order across pending reads and recovers after a failed operation',async()=>{
 const queue=new FileLoadQueue(),seen:string[]=[];
 let release!:()=>void;
 const blocked=new Promise<void>(resolve=>{release=resolve;});
 const first=queue.run(async()=>{await blocked;seen.push('drop');throw new Error('bad file');});
 const failure=expect(first).rejects.toThrow('bad file');
 const second=queue.run(async()=>{seen.push('open');});
 await Promise.resolve();expect(seen).toEqual([]);
 release();await failure;await second;expect(seen).toEqual(['drop','open']);
});
it('invalidates active and queued reads on disposal without invalidating the next lifecycle',async()=>{
 const queue=new FileLoadQueue(),seen:string[]=[];
 let release!:()=>void;
 const blocked=new Promise<void>(resolve=>{release=resolve;});
 const first=queue.run(async current=>{await blocked;if(current())seen.push('stale completion');});
 const pending=queue.run(async()=>{seen.push('stale queued');});
 await Promise.resolve();queue.dispose();
 await queue.run(async()=>{seen.push('inactive');});
 queue.activate();
 const next=queue.run(async()=>{seen.push('new');});
 release();await Promise.all([first,pending,next]);expect(seen).toEqual(['new']);
});
