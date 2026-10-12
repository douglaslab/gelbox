import {it,expect} from 'vitest';
import {bandFocusState} from '../../src/lib/gel/bandFocus';
import {initialGelState} from '../../src/lib/gel/gelState';
import {deriveGelScene} from '../../src/lib/gel/gelScene';
import {reviseSample,copySample} from '../../src/lib/gel/sampleFragRef';
it('focus follows sample identity across lanes and immutable edits, without byte rounding DNA colors',()=>{
 const state=initialGelState(),original=state.samples[0]!,sample=reviseSample(original,{fragments:[{...original.fragments[0],color:[.1234567,.7654321,.3333333]}]});
 const band=deriveGelScene(state).bands[0];state.samples=[sample,sample,copySample(sample)];state.selection={sample:original,fragmentIndex:0};state.rollover={sample:state.samples[2]!,fragmentIndex:0};
 const result=bandFocusState([band,band,band],[{lane:0,fragment:0},{lane:1,fragment:0},{lane:2,fragment:0}],state);
 expect(result.map(r=>[r.selected,r.hovered])).toEqual([[true,false],[true,false],[false,true]]);
 expect(result.map(r=>r.color)).toEqual(Array(3).fill([.1234567,.7654321,.3333333]));
});
it('dye focus uses half the band display color, independent of fragment color',()=>{
 const state=initialGelState(),sample=state.samples[0]!,band={...deriveGelScene(state).bands[0],color:[.1234567,.7654321,.3333333] as [number,number,number]};
 state.samples=[{...sample,fragments:[{...sample.fragments[0],dye:0,color:[1,0,0]}]}];
 const result=bandFocusState([band],[{lane:0,fragment:0}],state)[0];
 expect(result.color).toEqual([0.061728350818157196,0.3827160596847534,0.1666666567325592]);
 expect([result.selected,result.hovered]).toEqual([false,false]);
});
