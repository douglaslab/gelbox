/** One pending promise per device; retired views remove their callbacks immediately. */
const devices=new WeakMap<GPUDevice,{lost:boolean;listeners:Set<()=>void>}>();
export function watchDeviceLoss(device:GPUDevice,listener:()=>void):()=>void {
  let record=devices.get(device);
  if(!record){
    record={lost:false,listeners:new Set()};devices.set(device,record);
    const current=record;
    void device.lost.then(()=>{
      current.lost=true;
      for(const callback of current.listeners)callback();
      current.listeners.clear();
    });
  }
  record.listeners.add(listener);
  const current=record;
  if(current.lost)queueMicrotask(()=>{
    if(current.listeners.delete(listener))listener();
  });
  return ()=>{current.listeners.delete(listener);};
}

export function watchGlLoss(canvas:HTMLCanvasElement,listener:()=>void):()=>void {
  const lost=(event:Event)=>{event.preventDefault();listener();};
  canvas.addEventListener('webglcontextlost',lost);
  return ()=>canvas.removeEventListener('webglcontextlost',lost);
}

/** Validation/OOM errors are asynchronous even when resource creation returns normally. */
export function watchDeviceErrors(device:GPUDevice,listener:()=>void):()=>void {
  const error=(event:Event)=>{
    // Shared-device views all recover; record the diagnostic only once per event.
    if(!event.defaultPrevented)console.error('WebGPU rendering error:',(event as GPUUncapturedErrorEvent).error.message);
    event.preventDefault();listener();
  };
  device.addEventListener('uncapturederror',error);
  return ()=>device.removeEventListener('uncapturederror',error);
}
