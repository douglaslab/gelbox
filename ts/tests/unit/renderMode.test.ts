import {expect,it} from 'vitest';
import {gelReducer,initialGelState} from '../../src/lib/gel/gelState';
import {serializeGelState} from '../../src/lib/gel/serialize';
it('Render defaults on; changing it preserves document data and survives replacement',()=>{
 const initial=initialGelState(),saved=serializeGelState(initial);
 expect(initial.renderEnabled).toBe(true);
 const off=gelReducer(initial,{type:'SET_RENDER_ENABLED',value:false});
 expect(off.renderEnabled).toBe(false);expect(serializeGelState(off)).toBe(saved);
 const loaded=gelReducer(off,{type:'LOAD_GEL_STATE',samples:initial.samples,numLanes:initial.numLanes,ctx:initial.ctx});
 expect(loaded.renderEnabled).toBe(false);
 expect(gelReducer(loaded,{type:'TOGGLE_RENDER'}).renderEnabled).toBe(true);
});
