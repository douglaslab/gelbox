import {describe,it,expect} from 'vitest';
import {isNativeAccelerator} from '../../src/lib/gel/nativeAccelerator';
describe('Cinder desktop accelerator mapping',()=>{
 it('uses Command rather than Control on macOS',()=>{
  expect(isNativeAccelerator({metaKey:false,ctrlKey:true},'MacIntel')).toBe(false);
  expect(isNativeAccelerator({metaKey:true,ctrlKey:false},'MacIntel')).toBe(true);
 });
 it('uses Control rather than the Windows key on Windows',()=>{
  expect(isNativeAccelerator({metaKey:false,ctrlKey:true},'Win32')).toBe(true);
  expect(isNativeAccelerator({metaKey:true,ctrlKey:false},'Win32')).toBe(false);
 });
 it('matches Cinder’s non-Windows branch on Linux',()=>{
  expect(isNativeAccelerator({metaKey:false,ctrlKey:true},'Linux x86_64')).toBe(false);
  expect(isNativeAccelerator({metaKey:true,ctrlKey:false},'Linux x86_64')).toBe(true);
 });
});
