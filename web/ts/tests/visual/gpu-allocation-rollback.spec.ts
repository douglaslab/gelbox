import {test,expect} from '@playwright/test';
for(const failure of ['second-texture','blur-pipeline','molecular-bindgroup','quad-upload','target-view','pingpong-second-texture','mesh-frame-upload','gel-frame-upload'])test(`GPU allocation rollback: ${failure}`,async({page})=>{
 await page.route('**/__allocation_probe',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>GPU allocation probe</title>'}));
 await page.goto('/__allocation_probe');
 const result=await page.evaluate(async failure=>{
  const {requestDevice}=await import('/src/lib/gpu/device.ts');
  const {createGelRenderer}=await import('/src/lib/gel/render.ts');
  const {createMeshBatch}=await import('/src/lib/gpu/meshBatch.ts');
  const {createQuad}=await import('/src/lib/gpu/quad.ts');
  const {createRenderTarget,createPingPong}=await import('/src/lib/gpu/target.ts');
  const {device}=await requestDevice();
  const resources:{label:string;destroyed:boolean}[]=[];
  let textures=0;
  for(const method of ['createBuffer','createTexture'] as const){
   const original=device[method].bind(device);
   (device as any)[method]=(descriptor:any)=>{
    if(method==='createTexture'&&++textures===2&&failure.endsWith('second-texture'))throw Error('Injected allocation failure');
    const resource=(original as any)(descriptor),record={label:descriptor.label??method,destroyed:false};
    resources.push(record);
    if(method==='createTexture'&&failure==='target-view')resource.createView=()=>{throw Error('Injected allocation failure')};
    const destroy=resource.destroy.bind(resource);
    resource.destroy=()=>{record.destroyed=true;destroy();};return resource;
   };
  }
  const pipeline=device.createRenderPipeline.bind(device);
  device.createRenderPipeline=(descriptor:any)=>{
   if(failure==='blur-pipeline'&&descriptor.label==='blur9')throw Error('Injected allocation failure');
   return pipeline(descriptor);
  };
  const bind=device.createBindGroup.bind(device);
  device.createBindGroup=(descriptor:any)=>{
   if(failure==='molecular-bindgroup')throw Error('Injected allocation failure');return bind(descriptor);
  };
  if(failure==='quad-upload')device.queue.writeBuffer=()=>{throw Error('Injected allocation failure')};
  let error='',firstAllocation=0;
  try{
   if(failure==='molecular-bindgroup')createMeshBatch(device,{viewport:{width:360,height:520},blend:'over'});
   else if(failure==='quad-upload')createQuad(device);
   else if(failure==='target-view')createRenderTarget(device,16,16);
   else if(failure==='pingpong-second-texture')createPingPong(device,16,16);
   else if(failure==='mesh-frame-upload'){
    const batch=createMeshBatch(device,{viewport:{width:32,height:32},blend:'over'});
    const target=createRenderTarget(device,32,32);firstAllocation=resources.length;
    device.queue.writeBuffer=()=>{throw Error('Injected allocation failure')};
    batch.draw(device.createCommandEncoder(),target.view,{data:new Float32Array(18),vertexCount:3},{clear:true,callIdx:0});
   }else if(failure==='gel-frame-upload'){
    const renderer=createGelRenderer(device,{width:390,height:520},1);
    const band={rect:{x1:10,y1:20,x2:30,y2:26},smearAbove:0,smearBelow:0,
      smearBrightnessAbove:[0,0],smearBrightnessBelow:[0,0],flameHeight:0,smileHeight:2,smileExp:2,
      blur:1,brightness:1,color:[1,1,1],randSeed:1,wellDamage:0,wellDamageRandSeed:1,mass:10,aggregate:1,degrade:0};
    renderer.setBands([band,band]);firstAllocation=resources.length;
    const write=device.queue.writeBuffer.bind(device.queue);
    device.queue.writeBuffer=(...args:any[])=>{if(args[0].label==='meshBatch-vbo[1]')throw Error('Injected allocation failure');return (write as any)(...args);};
    renderer.render();
   }else createGelRenderer(device,{width:390,height:520},1);
  }catch(e){error=String(e);}
  const result={error,allocated:resources.length-firstAllocation,leaked:resources.slice(firstAllocation).filter(r=>!r.destroyed).map(r=>r.label)};
  device.destroy();return result;
 },failure);
 expect(result.error).toContain('Injected allocation failure');
 expect(result.allocated).toBeGreaterThan(0);
 expect(result.leaked).toEqual([]);
});
