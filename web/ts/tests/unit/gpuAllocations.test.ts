import {test,expect,vi} from 'vitest';
import {allocateBuffer,withAllocationRollback} from '../../src/lib/gpu/allocations';
function device(){
 const allocations:{destroy:ReturnType<typeof vi.fn>}[]=[];
 const gpu={createBuffer:()=>{const value={destroy:vi.fn()};allocations.push(value);return value;}} as unknown as GPUDevice;
 return {gpu,allocations};
}
const descriptor={size:16,usage:0};
test('outer rollback destroys resources from completed nested constructors',()=>{
 const {gpu,allocations}=device();
 expect(()=>withAllocationRollback(gpu,()=>{
  allocateBuffer(gpu,descriptor);
  withAllocationRollback(gpu,()=>allocateBuffer(gpu,descriptor));
  throw Error('outer failure');
 })).toThrow('outer failure');
 expect(allocations).toHaveLength(2);allocations.forEach(r=>expect(r.destroy).toHaveBeenCalledTimes(1));
});
test('caught inner failure restores parent ownership without retaining destroyed allocations',()=>{
 const {gpu,allocations}=device();
 withAllocationRollback(gpu,()=>{
  allocateBuffer(gpu,descriptor);
  try{withAllocationRollback(gpu,()=>{allocateBuffer(gpu,descriptor);throw Error('inner');});}catch{}
  allocateBuffer(gpu,descriptor);
 });
 expect(allocations.map(r=>r.destroy.mock.calls.length)).toEqual([0,1,0]);
 expect(()=>withAllocationRollback(gpu,()=>{throw Error('later');})).toThrow('later');
 expect(allocations.map(r=>r.destroy.mock.calls.length)).toEqual([0,1,0]);
});
test('rollback ownership is isolated between devices',()=>{
 const a=device(),b=device();
 expect(()=>withAllocationRollback(a.gpu,()=>{
  allocateBuffer(a.gpu,descriptor);
  withAllocationRollback(b.gpu,()=>allocateBuffer(b.gpu,descriptor));
  throw Error('a failed');
 })).toThrow('a failed');
 expect(a.allocations[0].destroy).toHaveBeenCalledTimes(1);expect(b.allocations[0].destroy).not.toHaveBeenCalled();
});
