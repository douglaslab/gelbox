import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const root='../reference/native/modern/well-scenes/';
const cases=JSON.parse(fs.readFileSync(root+'cases.json','utf8'));
test('measure WebGL line-loop raster against native window',async({page},info)=>{
 await page.goto('/#/gel');
 const results=[];
 for(const scene of cases){
  const native=fs.readFileSync(root+scene.id+'.png').toString('base64');
  results.push(await page.evaluate(async({scene,native})=>{
   const width=390*scene.scale,height=50*scene.scale;
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const gl=canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:true})!;
   const multi=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,multi);
   const color=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,color);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.RGBA8,width,height);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,color);
   if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Incomplete multisample target');
   const samples=gl.getParameter(gl.SAMPLES);
   const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)!);return s;};
   const vs=shader(gl.VERTEX_SHADER,`#version 300 es
    in vec2 p;void main(){gl_Position=vec4(p.x/${width}.0*2.-1.,p.y/${height}.0*2.-1.,0.,1.);}`);
   const fs=shader(gl.FRAGMENT_SHADER,`#version 300 es
    precision highp float;out vec4 color;void main(){color=vec4(.8);}`);
   const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
   gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   for(const [x1,y1,x2,y2] of scene.rects){gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([x1,y1,x2,y1,x2,y2,x1,y2].map(x=>x*scene.scale)),gl.STATIC_DRAW);gl.drawArrays(gl.LINE_LOOP,0,4);}
   const resolved=gl.createFramebuffer();gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,resolved);
   const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
   if(gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Incomplete resolve target');
   gl.blitFramebuffer(0,0,width,height,0,0,width,height,gl.COLOR_BUFFER_BIT,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,resolved);
   const raw=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,raw);
   const image=new Image();image.src='data:image/png;base64,'+native;await image.decode();
   const ref=document.createElement('canvas');ref.width=width;ref.height=height;const ctx=ref.getContext('2d')!;ctx.drawImage(image,0,0);const expected=ctx.getImageData(0,0,width,height).data;
   let differentPixels=0,maximumChannelError=0;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){let different=false;for(let c=0;c<3;c++){const error=Math.abs(expected[(y*width+x)*4+c]-raw[(y*width+x)*4+c]);maximumChannelError=Math.max(maximumChannelError,error);different ||= error!==0;}if(different)differentPixels++;}
   const antialias=gl.getContextAttributes()!.antialias;
   gl.deleteFramebuffer(multi);gl.deleteRenderbuffer(color);gl.deleteFramebuffer(resolved);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.getExtension('WEBGL_lose_context')?.loseContext();
   return {id:scene.id,samples,antialias,differentPixels,maximumChannelError};
  },{scene,native}));
 }
 fs.writeFileSync(info.outputPath('line-loop.json'),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results));expect(results).toHaveLength(16);expect(results.every(r=>r.differentPixels===0)).toBe(true);
});
