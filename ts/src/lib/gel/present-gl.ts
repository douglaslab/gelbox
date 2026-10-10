import {createGlProgram} from '../gpu/gl/program';
import {validatePresentationSize,wellVertices,physicalBandVertices,type DirectPresentationBase,type PresentationSize,type PresentationOptions,type WellRect} from './presentationTypes';

/** Direct triangles share the well multisample surface. GL input textures have their logical top at v=1. The final blit flips the
 * reflected MSAA raster into the canvas; changing that order changes corners. */
export function createGlGelPresentation(gl:WebGL2RenderingContext,size:PresentationSize,options:PresentationOptions={}) {
  validatePresentationSize(size);
  const {width,height}=size,cleanup:Array<()=>void>=[];
  let destroyed=false,capacity=0;
  let bandProgram:ReturnType<typeof createGlProgram>|undefined,bandVertices:WebGLBuffer|undefined,bandCapacity=0;
  const destroy=()=>{if(destroyed)return;destroyed=true;for(const dispose of cleanup.reverse())dispose();};
  const required=<T>(value:T|null,label:string):T=>{if(value===null)throw new Error('Could not allocate '+label);return value;};
  try {
    const msaa=required(gl.createFramebuffer(),'gel presentation framebuffer');cleanup.push(()=>gl.deleteFramebuffer(msaa));
    const color=required(gl.createRenderbuffer(),'gel presentation renderbuffer');cleanup.push(()=>gl.deleteRenderbuffer(color));
    gl.bindFramebuffer(gl.FRAMEBUFFER,msaa);gl.bindRenderbuffer(gl.RENDERBUFFER,color);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.RGBA8,width,height);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,color);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Incomplete gel presentation multisample framebuffer');
    const resolved=required(gl.createFramebuffer(),'gel presentation resolve framebuffer');cleanup.push(()=>gl.deleteFramebuffer(resolved));
    const texture=required(gl.createTexture(),'gel presentation resolve texture');cleanup.push(()=>gl.deleteTexture(texture));
    gl.bindFramebuffer(gl.FRAMEBUFFER,resolved);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Incomplete gel presentation resolve framebuffer');
    const vao=required(gl.createVertexArray(),'gel presentation vertex array');cleanup.push(()=>gl.deleteVertexArray(vao));
    const vertices=required(gl.createBuffer(),'gel presentation vertices');cleanup.push(()=>gl.deleteBuffer(vertices));
    const baseProgram=createGlProgram(gl,`
      void main(){vec2 p=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);gl_Position=vec4(p,0.,1.);}`,`
      uniform sampler2D base;out vec4 color;
      void main(){vec2 uv=gl_FragCoord.xy/vec2(${width}.,${height}.);color=vec4(texture(base,vec2(uv.x,1.-uv.y)).rgb,1.);}`,'gel-presentation-base');cleanup.push(()=>baseProgram.destroy());
    const lines=createGlProgram(gl,`
      in vec2 p;void main(){gl_Position=vec4(p.x/${width}.*2.-1.,p.y/${height}.*2.-1.,0.,1.);}`,`
      out vec4 color;void main(){color=vec4(.8);}`,'gel-presentation-lines');cleanup.push(()=>lines.destroy());
    const location=lines.attrib('p');
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    return {
      draw(base:WebGLTexture|DirectPresentationBase,wells:readonly WellRect[],scale:number) {
        if(destroyed)throw new Error('Gel presentation has been destroyed');
        gl.bindFramebuffer(gl.FRAMEBUFFER,msaa);gl.viewport(0,0,width,height);
        gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
        const background='mesh' in base?(base.background??[0,0,0]):[0,0,0];
        gl.colorMask(true,true,true,true);gl.clearColor(background[0],background[1],background[2],1);gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(vao);
        if('mesh' in base){
          if(!bandProgram){
            bandProgram=createGlProgram(gl,`
              in vec2 p;in vec4 c;out vec4 tint;
              void main(){gl_Position=vec4(p.x/${width}.*2.-1.,p.y/${height}.*2.-1.,0.,1.);tint=c;}`,`
              in vec4 tint;out vec4 color;void main(){color=tint;}`,'gel-presentation-bands');
            const program=bandProgram;cleanup.push(()=>program.destroy());
          }
          const data=physicalBandVertices(base,scale);
          if(data.byteLength){
            if(!bandVertices){bandVertices=required(gl.createBuffer(),'gel presentation bands');const buffer=bandVertices;cleanup.push(()=>gl.deleteBuffer(buffer));}
            gl.bindBuffer(gl.ARRAY_BUFFER,bandVertices);
            if(data.byteLength>bandCapacity){bandCapacity=Math.max(1024,2**Math.ceil(Math.log2(data.byteLength)));gl.bufferData(gl.ARRAY_BUFFER,bandCapacity,gl.DYNAMIC_DRAW);}
            gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.useProgram(bandProgram.program);
            const p=bandProgram.attrib('p'),c=bandProgram.attrib('c');gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(c);
            gl.vertexAttribPointer(p,2,gl.FLOAT,false,24,0);gl.vertexAttribPointer(c,4,gl.FLOAT,false,24,8);
            gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.SRC_ALPHA,options.meshBlend==='over'?gl.ONE_MINUS_SRC_ALPHA:gl.ONE,gl.ZERO,gl.ONE);
            gl.drawArrays(gl.TRIANGLES,0,base.mesh.vertexCount);gl.disableVertexAttribArray(p);gl.disableVertexAttribArray(c);
          }
        }else{
          gl.useProgram(baseProgram.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,base);gl.uniform1i(baseProgram.uniform('base'),0);gl.drawArrays(gl.TRIANGLES,0,3);
        }
        if(wells.length){
          const data=wellVertices(wells,scale);gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
          if(data.byteLength>capacity){capacity=Math.max(1024,2**Math.ceil(Math.log2(data.byteLength)));gl.bufferData(gl.ARRAY_BUFFER,capacity,gl.DYNAMIC_DRAW);}
          gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.useProgram(lines.program);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
          gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);gl.lineWidth(1);
          for(let i=0;i<wells.length;i++)gl.drawArrays(gl.LINE_STRIP,i*5,5);
          gl.disableVertexAttribArray(location);
        }
        gl.disable(gl.BLEND);gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER,msaa);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,resolved);
        gl.blitFramebuffer(0,0,width,height,0,0,width,height,gl.COLOR_BUFFER_BIT,gl.NEAREST);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER,resolved);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
        gl.blitFramebuffer(0,0,width,height,0,height,width,0,gl.COLOR_BUFFER_BIT,gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      },destroy,
    };
  }catch(error){destroy();throw error;}
}
