import {test,expect,vi} from 'vitest';
import {watchDeviceLoss} from '../../src/lib/gpu/loss';
function device(){
 let lose!:()=>void;
 const lost=new Promise<void>(resolve=>{lose=resolve;});
 return {gpu:{lost} as unknown as GPUDevice,lose};
}
test('retired views unsubscribe while remaining views receive shared device loss once',async()=>{
 const {gpu,lose}=device(),retired=vi.fn(),a=vi.fn(),b=vi.fn();
 const stop=watchDeviceLoss(gpu,retired);watchDeviceLoss(gpu,a);watchDeviceLoss(gpu,b);
 stop();lose();await Promise.resolve();
 expect(retired).not.toHaveBeenCalled();expect(a).toHaveBeenCalledTimes(1);expect(b).toHaveBeenCalledTimes(1);
});
test('already-lost device notifies new views asynchronously and permits cancellation',async()=>{
 const {gpu,lose}=device();watchDeviceLoss(gpu,()=>{});lose();await Promise.resolve();
 const live=vi.fn(),retired=vi.fn();watchDeviceLoss(gpu,live);const stop=watchDeviceLoss(gpu,retired);
 expect(live).not.toHaveBeenCalled();stop();await Promise.resolve();
 expect(live).toHaveBeenCalledTimes(1);expect(retired).not.toHaveBeenCalled();
});
