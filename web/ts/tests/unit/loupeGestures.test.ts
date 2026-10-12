import {it,expect} from 'vitest';
import {gelReducer,initialGelState} from '../../src/lib/gel/gelState';
it('native detail frame starts centered one width right of its anchor',()=>{
 const s=gelReducer(initialGelState(),{type:'ADD_LOUPE',anchor:{x:20,y:100}} as any);
 expect(s.loupes[0].frame).toEqual({x:105.5,y:14.5});
});
it.each(['frame','anchor','both'] as const)('loupe %s drag preserves independent coordinates',mode=>{
 const s=gelReducer(initialGelState(),{type:'ADD_LOUPE',anchor:{x:20,y:100}} as any);
 const moved=gelReducer(s,{type:'MOVE_LOUPE',id:1,mode,delta:{x:12,y:-5}} as any);
 expect(moved.loupes[0].anchor).toEqual(mode==='frame'?s.loupes[0].anchor:{x:32,y:95});
 expect(moved.loupes[0].frame).toEqual(mode==='anchor'?s.loupes[0].frame:{x:117.5,y:9.5});
 if(mode==='frame')expect(moved.loupes[0].anchor).toBe(s.loupes[0].anchor);
});
