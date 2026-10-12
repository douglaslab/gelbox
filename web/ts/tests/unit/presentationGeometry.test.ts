import {describe,it,expect} from 'vitest';
import {directPresentationGeometry,clipPresentationScissor,presentationBlend} from '../../src/lib/gel/presentationTypes';
describe('ordered presentation geometry',()=>{
 it('transforms local vertices before viewport origin and physical scaling',()=>{
  const original=new Float32Array([2,3,.2,.4,.6,.5]);
  const {data}=directPresentationGeometry({mesh:{data:new Float32Array(),vertexCount:0},origin:{x:1,y:2},underlay:[{mesh:{data:original,vertexCount:1},transform:[2,0,.5,-1,4,8]}]},2);
  expect(Array.from(data.slice(0,2))).toEqual([17,6]);
  expect(Array.from(original.slice(0,2))).toEqual([2,3]);
 });
 it('clips physical scissors to the surface, preserving empty regions',()=>{
  expect(clipPresentationScissor(undefined,{width:64,height:32})).toEqual({x:0,y:0,width:64,height:32});
  expect(clipPresentationScissor({x:-5,y:20,width:15,height:30},{width:64,height:32})).toEqual({x:0,y:20,width:10,height:12});
  expect(clipPresentationScissor({x:70,y:0,width:10,height:10},{width:64,height:32})).toBeNull();
  expect(clipPresentationScissor({x:1,y:1,width:0,height:10},{width:64,height:32})).toBeNull();
 });
 it('rejects noninteger or invalid scissors before GPU calls',()=>{
  expect(()=>clipPresentationScissor({x:.5,y:0,width:10,height:10},{width:64,height:32})).toThrow();
  expect(()=>clipPresentationScissor({x:0,y:0,width:-1,height:10},{width:64,height:32})).toThrow();
 });
 it('cannot encode additive blending over an unknown transparent underlay',()=>{
  expect(presentationBlend(undefined,{transparent:true})).toBe('over');
  expect(()=>presentationBlend('additive',{transparent:true})).toThrow();
  expect(presentationBlend('additive',{meshBlend:'over'})).toBe('additive');
 });
});
