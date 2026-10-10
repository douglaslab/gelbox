import {expect,it} from 'vitest';
import cases from '../../../reference/native/numerical/direct-bands-cases.json';
import outputs from '../../../reference/native/numerical/direct-bands-outputs.json';
import {buildDirectBandMesh} from '../../src/lib/gel/directBands';
import type {Band} from '../../src/lib/sim/band';
for(const c of cases)it(`matches compiled native direct bands: ${c.id}`,()=>{
 const mesh=buildDirectBandMesh(c.bands as Band[]);
 const expected=outputs.find(row=>row.id===c.id)!.data;
 expect(mesh.vertexCount).toBe(expected.length/6);
 expect(Array.from(mesh.data)).toEqual(expected);
});
