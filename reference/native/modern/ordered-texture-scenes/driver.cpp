// Rasterize meshes captured from unchanged native MolecularSim particle methods.
#define GL_SILENCE_DEPRECATION
#include <OpenGL/OpenGL.h>
#include <OpenGL/gl3.h>
#include <fstream>
#include <iostream>
#include <vector>
#include <string>
#include <stdexcept>
#include "cases.h"

GLuint shader(GLenum type,const char* source){auto s=glCreateShader(type);glShaderSource(s,1,&source,nullptr);glCompileShader(s);GLint ok;glGetShaderiv(s,GL_COMPILE_STATUS,&ok);if(!ok)throw std::runtime_error("shader failed");return s;}
GLuint program(const char* vs,const char* fs){auto p=glCreateProgram(),v=shader(GL_VERTEX_SHADER,vs),f=shader(GL_FRAGMENT_SHADER,fs);glAttachShader(p,v);glAttachShader(p,f);glLinkProgram(p);glDeleteShader(v);glDeleteShader(f);GLint ok;glGetProgramiv(p,GL_LINK_STATUS,&ok);if(!ok)throw std::runtime_error("link failed");return p;}
int main(int argc,char** argv){
 if(argc!=2)throw std::runtime_error("output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw std::runtime_error("pixel format failed");
 CGLContextObj context=nullptr;if(CGLCreateContext(pf,nullptr,&context))throw std::runtime_error("context failed");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(context);
 std::cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
 auto bands=program("#version 150\nin vec2 p;in vec4 c;uniform mat3 transform;out vec4 tint;void main(){vec3 q=transform*vec3(p,1);gl_Position=vec4(q.x/64.*2.-1.,q.y/64.*2.-1.,0.,1.);tint=c;}","#version 150\nin vec4 tint;out vec4 color;void main(){color=tint;}");
 auto textured=program("#version 150\nin vec2 p;in vec2 uv;uniform mat3 transform;out vec2 texcoord;void main(){vec3 q=transform*vec3(p,1);gl_Position=vec4(q.x/64.*2.-1.,q.y/64.*2.-1.,0.,1.);texcoord=uv;}","#version 150\nin vec2 texcoord;uniform sampler2D image;uniform vec4 tint;uniform bool premultiplied;out vec4 color;void main(){color=texture(image,texcoord)*tint;if(premultiplied)color.rgb*=tint.a;}");
 std::vector<GLuint> images;
 for(auto &image:textures){GLuint tex;glGenTextures(1,&tex);glBindTexture(GL_TEXTURE_2D,tex);int level=0;for(auto &mip:image){glTexImage2D(GL_TEXTURE_2D,level++,GL_RGBA8,mip.width,mip.height,0,GL_RGBA,GL_UNSIGNED_BYTE,mip.data.data());}glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAX_LEVEL,level-1);images.push_back(tex);}
 GLuint vao,vbo;glGenVertexArrays(1,&vao);glBindVertexArray(vao);glGenBuffers(1,&vbo);glBindBuffer(GL_ARRAY_BUFFER,vbo);
 for(auto &c:cases)for(int scale:{1,2}){
  int width=64*scale,height=64*scale;
  GLuint fbo,msaa,resolved,tex;glGenFramebuffers(1,&fbo);glBindFramebuffer(GL_FRAMEBUFFER,fbo);glGenRenderbuffers(1,&msaa);glBindRenderbuffer(GL_RENDERBUFFER,msaa);glRenderbufferStorageMultisample(GL_RENDERBUFFER,4,GL_RGBA8,width,height);glFramebufferRenderbuffer(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_RENDERBUFFER,msaa);
  if(glCheckFramebufferStatus(GL_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete MSAA");
  glViewport(0,0,width,height);glDisable(GL_BLEND);glClearColor(0.15f,0.2f,0.25f,1);glClear(GL_COLOR_BUFFER_BIT);
  glUseProgram(bands);glEnable(GL_BLEND);glBlendFunc(GL_SRC_ALPHA,GL_ONE_MINUS_SRC_ALPHA);
  auto draw=[&](const std::vector<float>& data,GLenum mode){
   glBufferData(GL_ARRAY_BUFFER,data.size()*sizeof(float),data.data(),GL_STATIC_DRAW);
   auto p=glGetAttribLocation(bands,"p"),color=glGetAttribLocation(bands,"c");glEnableVertexAttribArray(p);glEnableVertexAttribArray(color);
   glVertexAttribPointer(p,2,GL_FLOAT,GL_FALSE,6*sizeof(float),nullptr);glVertexAttribPointer(color,4,GL_FLOAT,GL_FALSE,6*sizeof(float),(void*)(2*sizeof(float)));
   glDrawArrays(mode,0,data.size()/6);glDisableVertexAttribArray(p);glDisableVertexAttribArray(color);
  };
  for(auto &op:c.ops){
   glBlendFunc(op.premultiplied?GL_ONE:GL_SRC_ALPHA,op.additive?GL_ONE:GL_ONE_MINUS_SRC_ALPHA);
   auto active=op.texture<0?bands:textured;glUseProgram(active);
   glUniformMatrix3fv(glGetUniformLocation(active,"transform"),1,GL_FALSE,op.transform.data());
   if(op.clip.size()) {glEnable(GL_SCISSOR_TEST);glScissor(op.clip[0]*scale,op.clip[1]*scale,op.clip[2]*scale,op.clip[3]*scale);}
   else glDisable(GL_SCISSOR_TEST);
   if(op.texture<0)draw(op.vertices,op.topology);
   else{
    glActiveTexture(GL_TEXTURE0);glBindTexture(GL_TEXTURE_2D,images[op.texture]);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,op.minFilter);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,op.magFilter);
    glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_WRAP_S,op.address);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_WRAP_T,op.address);
    glUniform1i(glGetUniformLocation(textured,"image"),0);glUniform1i(glGetUniformLocation(textured,"premultiplied"),op.premultiplied);glUniform4fv(glGetUniformLocation(textured,"tint"),1,op.tint.data());
    glBufferData(GL_ARRAY_BUFFER,op.vertices.size()*sizeof(float),op.vertices.data(),GL_STATIC_DRAW);
    auto p=glGetAttribLocation(textured,"p"),uv=glGetAttribLocation(textured,"uv");glEnableVertexAttribArray(p);glEnableVertexAttribArray(uv);
    glVertexAttribPointer(p,2,GL_FLOAT,GL_FALSE,4*sizeof(float),nullptr);glVertexAttribPointer(uv,2,GL_FLOAT,GL_FALSE,4*sizeof(float),(void*)(2*sizeof(float)));
    glDrawArrays(GL_TRIANGLES,0,6);glDisableVertexAttribArray(p);glDisableVertexAttribArray(uv);
   }
  }
  glDisable(GL_SCISSOR_TEST);
  glGenFramebuffers(1,&resolved);glBindFramebuffer(GL_DRAW_FRAMEBUFFER,resolved);glGenTextures(1,&tex);glBindTexture(GL_TEXTURE_2D,tex);glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA8,width,height,0,GL_RGBA,GL_UNSIGNED_BYTE,nullptr);glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,tex,0);
  if(glCheckFramebufferStatus(GL_DRAW_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete resolve");
  glBlitFramebuffer(0,0,width,height,0,0,width,height,GL_COLOR_BUFFER_BIT,GL_NEAREST);glBindFramebuffer(GL_FRAMEBUFFER,resolved);
  std::vector<unsigned char> raw(width*height*4);glReadPixels(0,0,width,height,GL_RGBA,GL_UNSIGNED_BYTE,raw.data());
  std::ofstream out(std::string(argv[1])+"/"+c.id+"-"+std::to_string(scale)+".rgba",std::ios::binary);out.write((char*)raw.data(),raw.size());
  glDeleteTextures(1,&tex);glDeleteFramebuffers(1,&resolved);glDeleteRenderbuffers(1,&msaa);glDeleteFramebuffers(1,&fbo);
 }
 for(auto image:images)glDeleteTextures(1,&image);glDeleteProgram(textured);
 glDeleteBuffers(1,&vbo);glDeleteVertexArrays(1,&vao);glDeleteProgram(bands);CGLSetCurrentContext(nullptr);CGLDestroyContext(context);
}
