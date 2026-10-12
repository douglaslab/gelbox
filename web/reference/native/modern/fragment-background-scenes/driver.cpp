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
#include "geometry.h"
GLuint shader(GLenum type,const char* source){auto s=glCreateShader(type);glShaderSource(s,1,&source,nullptr);glCompileShader(s);GLint ok;glGetShaderiv(s,GL_COMPILE_STATUS,&ok);if(!ok)throw std::runtime_error("shader failed");return s;}
GLuint program(const char* vs,const char* fs){auto p=glCreateProgram(),v=shader(GL_VERTEX_SHADER,vs),f=shader(GL_FRAGMENT_SHADER,fs);glAttachShader(p,v);glAttachShader(p,f);glLinkProgram(p);glDeleteShader(v);glDeleteShader(f);GLint ok;glGetProgramiv(p,GL_LINK_STATUS,&ok);if(!ok)throw std::runtime_error("link failed");return p;}
int main(int argc,char** argv){
 if(argc!=2)throw std::runtime_error("output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw std::runtime_error("pixel format failed");
 CGLContextObj context=nullptr;if(CGLCreateContext(pf,nullptr,&context))throw std::runtime_error("context failed");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(context);
 std::cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
 auto bands=program("#version 150\nin vec2 p;in vec4 c;out vec4 tint;void main(){gl_Position=vec4(p.x/303.*2.-1.,p.y/520.*2.-1.,0.,1.);tint=c;}","#version 150\nin vec4 tint;out vec4 color;void main(){color=tint;}");
 GLuint vao,vbo;glGenVertexArrays(1,&vao);glBindVertexArray(vao);glGenBuffers(1,&vbo);glBindBuffer(GL_ARRAY_BUFFER,vbo);
 struct Background{const char* id;float r,g,b;};
 std::vector<Background> backgrounds={{"white",255,255,255},{"rose",217,45,81},{"navy",26,39,65}};
 for(auto &c:cases)for(int scale:{1,2})for(auto &background:backgrounds){
  int width=303*scale,height=520*scale;
  GLuint fbo,msaa,resolved,tex;glGenFramebuffers(1,&fbo);glBindFramebuffer(GL_FRAMEBUFFER,fbo);glGenRenderbuffers(1,&msaa);glBindRenderbuffer(GL_RENDERBUFFER,msaa);glRenderbufferStorageMultisample(GL_RENDERBUFFER,4,GL_RGBA8,width,height);glFramebufferRenderbuffer(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_RENDERBUFFER,msaa);
  if(glCheckFramebufferStatus(GL_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete MSAA");
  glViewport(0,0,width,height);glDisable(GL_BLEND);glClearColor(background.r/255.f,background.g/255.f,background.b/255.f,1);glClear(GL_COLOR_BUFFER_BIT);
  glUseProgram(bands);glEnable(GL_BLEND);glBlendFunc(GL_SRC_ALPHA,GL_ONE_MINUS_SRC_ALPHA);
  auto draw=[&](const std::vector<float>& data,GLenum mode){
   glBufferData(GL_ARRAY_BUFFER,data.size()*sizeof(float),data.data(),GL_STATIC_DRAW);
   auto p=glGetAttribLocation(bands,"p"),color=glGetAttribLocation(bands,"c");glEnableVertexAttribArray(p);glEnableVertexAttribArray(color);
   glVertexAttribPointer(p,2,GL_FLOAT,GL_FALSE,6*sizeof(float),nullptr);glVertexAttribPointer(color,4,GL_FLOAT,GL_FALSE,6*sizeof(float),(void*)(2*sizeof(float)));
   glDrawArrays(mode,0,data.size()/6);glDisableVertexAttribArray(p);glDisableVertexAttribArray(color);
  };
  // FragmentView::draw order; Cinder's default line width is one physical pixel.
  draw(shadow,GL_TRIANGLE_FAN);draw(fill,GL_TRIANGLE_FAN);glLineWidth(1);draw(stroke,GL_LINES);
  // drawRepresentativeOfFrag requires fade > 0; the empty fixture has no selected representative.
  if(c.visible)draw(c.data,GL_TRIANGLES);
  glGenFramebuffers(1,&resolved);glBindFramebuffer(GL_DRAW_FRAMEBUFFER,resolved);glGenTextures(1,&tex);glBindTexture(GL_TEXTURE_2D,tex);glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA8,width,height,0,GL_RGBA,GL_UNSIGNED_BYTE,nullptr);glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,tex,0);
  if(glCheckFramebufferStatus(GL_DRAW_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete resolve");
  glBlitFramebuffer(0,0,width,height,0,0,width,height,GL_COLOR_BUFFER_BIT,GL_NEAREST);glBindFramebuffer(GL_FRAMEBUFFER,resolved);
  std::vector<unsigned char> raw(width*height*4);glReadPixels(0,0,width,height,GL_RGBA,GL_UNSIGNED_BYTE,raw.data());
  std::ofstream out(std::string(argv[1])+"/"+c.id+"-"+std::to_string(scale)+"-"+background.id+".rgba",std::ios::binary);out.write((char*)raw.data(),raw.size());
  glDeleteTextures(1,&tex);glDeleteFramebuffers(1,&resolved);glDeleteRenderbuffers(1,&msaa);glDeleteFramebuffers(1,&fbo);
 }
 glDeleteBuffers(1,&vbo);glDeleteVertexArrays(1,&vao);glDeleteProgram(bands);CGLSetCurrentContext(nullptr);CGLDestroyContext(context);
}
