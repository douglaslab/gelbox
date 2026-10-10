import {createGlProgram} from '../gpu/gl/program';
import {presentationSamplingKey,type PresentationSize,type PresentationTextureLayer,type PresentationOptions,type PresentationBlend} from './presentationTypes';

export function createGlPresentationTextures(gl:WebGL2RenderingContext,size:PresentationSize,options:PresentationOptions){
  let vertices:WebGLBuffer|null=null,capacity=0;
  let program:ReturnType<typeof createGlProgram>|undefined;
  const samplers=new Map<string,WebGLSampler>();
  return {
    upload(data:Float32Array){
      if(!data.byteLength)return;
      if(!vertices){vertices=gl.createBuffer();if(!vertices)throw new Error('Could not allocate presentation texture vertices');}
      gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
      if(data.byteLength>capacity){capacity=Math.max(1024,2**Math.ceil(Math.log2(data.byteLength)));gl.bufferData(gl.ARRAY_BUFFER,capacity,gl.DYNAMIC_DRAW);}
      gl.bufferSubData(gl.ARRAY_BUFFER,0,data);
    },
    draw(op:PresentationTextureLayer<WebGLTexture>,first:number,blend:PresentationBlend){
      if(!program)program=createGlProgram(gl,`
        in vec2 p;in vec4 c;in vec2 uv;out vec4 tint;out vec2 texcoord;
        void main(){gl_Position=vec4(p.x/${size.width}.*2.-1.,p.y/${size.height}.*2.-1.,0.,1.);tint=c;texcoord=uv;}`,`
        in vec4 tint;in vec2 texcoord;uniform sampler2D image;uniform bool premultiplied;out vec4 color;
        void main(){color=texture(image,texcoord)*tint;if(premultiplied)color.rgb*=tint.a;}`,'presentation-texture');
      const key=presentationSamplingKey(op.sampling);let sampler=samplers.get(key);
      if(!sampler){
        const created=gl.createSampler();if(!created)throw new Error('Could not allocate presentation sampler');
        sampler=created;samplers.set(key,sampler);
        const s=op.sampling,nearest=s.minFilter==='nearest';
        const min=s.mipmapFilter==='none'?(nearest?gl.NEAREST:gl.LINEAR):s.mipmapFilter==='nearest'?(nearest?gl.NEAREST_MIPMAP_NEAREST:gl.LINEAR_MIPMAP_NEAREST):(nearest?gl.NEAREST_MIPMAP_LINEAR:gl.LINEAR_MIPMAP_LINEAR);
        const address=(value:string)=>value==='repeat'?gl.REPEAT:value==='mirror-repeat'?gl.MIRRORED_REPEAT:gl.CLAMP_TO_EDGE;
        gl.samplerParameteri(sampler,gl.TEXTURE_MIN_FILTER,min);gl.samplerParameteri(sampler,gl.TEXTURE_MAG_FILTER,s.magFilter==='nearest'?gl.NEAREST:gl.LINEAR);
        gl.samplerParameteri(sampler,gl.TEXTURE_WRAP_S,address(s.addressModeU));gl.samplerParameteri(sampler,gl.TEXTURE_WRAP_T,address(s.addressModeV));
      }
      const premult=op.alpha==='premultiplied';
      gl.useProgram(program.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,op.texture);gl.bindSampler(0,sampler);
      gl.uniform1i(program.uniform('image'),0);gl.uniform1i(program.uniform('premultiplied'),premult?1:0);
      gl.bindBuffer(gl.ARRAY_BUFFER,vertices);
      const p=program.attrib('p'),c=program.attrib('c'),uv=program.attrib('uv');
      gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(c);gl.enableVertexAttribArray(uv);
      gl.vertexAttribPointer(p,2,gl.FLOAT,false,32,0);gl.vertexAttribPointer(c,4,gl.FLOAT,false,32,8);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,32,24);
      gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(premult?gl.ONE:gl.SRC_ALPHA,blend==='over'?gl.ONE_MINUS_SRC_ALPHA:gl.ONE,options.transparent?gl.ONE:gl.ZERO,options.transparent?gl.ONE_MINUS_SRC_ALPHA:gl.ONE);
      gl.drawArrays(gl.TRIANGLES,first,6);
      gl.disableVertexAttribArray(p);gl.disableVertexAttribArray(c);gl.disableVertexAttribArray(uv);
    },
    destroy(){if(vertices)gl.deleteBuffer(vertices);vertices=null;capacity=0;program?.destroy();program=undefined;for(const sampler of samplers.values())gl.deleteSampler(sampler);samplers.clear();},
  };
}
