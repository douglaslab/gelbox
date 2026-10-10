// Headless macOS OpenGL raster oracle. Geometry comes from native window captures.
#define GL_SILENCE_DEPRECATION
#include <OpenGL/OpenGL.h>
#include <OpenGL/gl3.h>
#include <fstream>
#include <iostream>
#include <vector>
#include <string>
#include <stdexcept>
#include "cases.h"
GLuint shader(GLenum type,const char* source){auto s=glCreateShader(type);glShaderSource(s,1,&source,nullptr);glCompileShader(s);GLint ok;glGetShaderiv(s,GL_COMPILE_STATUS,&ok);if(!ok){char log[4096];glGetShaderInfoLog(s,4096,nullptr,log);throw std::runtime_error(log);}return s;}
GLuint program(const char* vs,const char* fs){auto p=glCreateProgram(),v=shader(GL_VERTEX_SHADER,vs),f=shader(GL_FRAGMENT_SHADER,fs);glAttachShader(p,v);glAttachShader(p,f);glLinkProgram(p);glDeleteShader(v);glDeleteShader(f);GLint ok;glGetProgramiv(p,GL_LINK_STATUS,&ok);if(!ok)throw std::runtime_error("link failed");return p;}
int main(int argc,char** argv){
 if(argc!=2)throw std::runtime_error("output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;auto error=CGLChoosePixelFormat(attrs,&pf,&count);if(error||!pf)throw std::runtime_error("pixel format failed");
 CGLContextObj context=nullptr;error=CGLCreateContext(pf,nullptr,&context);CGLDestroyPixelFormat(pf);if(error)throw std::runtime_error("context failed");CGLSetCurrentContext(context);
 std::cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
 auto line=program("#version 150\nin vec2 p;uniform vec2 extent;uniform float direction;void main(){gl_Position=vec4(p.x/extent.x*2.-1.,direction*(p.y/extent.y*2.-1.),0.,1.);}","#version 150\nout vec4 color;void main(){color=vec4(.8);}");
 auto base=program("#version 150\nvoid main(){vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);gl_Position=vec4(p,0.,1.);}","#version 150\nuniform sampler2D image;uniform vec2 extent;uniform float direction;out vec4 color;void main(){vec2 uv=gl_FragCoord.xy/extent;uv.y=direction>0.?uv.y:1.-uv.y;color=texture(image,uv);}");
 GLuint vao,vbo;glGenVertexArrays(1,&vao);glBindVertexArray(vao);glGenBuffers(1,&vbo);
 for(auto &c:cases)for(int background=0;background<3;background++)for(int direction:{-1,1}){
  int width=390*c.scale,height=50*c.scale;
  GLuint fbo,msaa,resolved,tex,input;glGenFramebuffers(1,&fbo);glBindFramebuffer(GL_FRAMEBUFFER,fbo);glGenRenderbuffers(1,&msaa);glBindRenderbuffer(GL_RENDERBUFFER,msaa);glRenderbufferStorageMultisample(GL_RENDERBUFFER,4,GL_RGBA8,width,height);glFramebufferRenderbuffer(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_RENDERBUFFER,msaa);
  if(glCheckFramebufferStatus(GL_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete MSAA");
  std::vector<unsigned char> pixels(390*50*4);
  for(int y=0;y<50;y++)for(int x=0;x<390;x++){auto i=(y*390+x)*4;bool stripe=background==2&&x<90&&y>=18&&y<22;pixels[i]=background?(stripe?180:20):0;pixels[i+1]=background?(stripe?100:40):0;pixels[i+2]=background?(stripe?40:60):0;pixels[i+3]=255;}
  {std::ofstream inputFile(std::string(argv[1])+"/base-"+std::to_string(background)+".rgba",std::ios::binary);inputFile.write((char*)pixels.data(),pixels.size());}
  glGenTextures(1,&input);glBindTexture(GL_TEXTURE_2D,input);glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA8,390,50,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_LINEAR);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_LINEAR);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_WRAP_S,GL_CLAMP_TO_EDGE);glTexParameteri(GL_TEXTURE_2D,GL_TEXTURE_WRAP_T,GL_CLAMP_TO_EDGE);
  glViewport(0,0,width,height);glDisable(GL_BLEND);glClearColor(0,0,0,1);glClear(GL_COLOR_BUFFER_BIT);glUseProgram(base);glUniform1i(glGetUniformLocation(base,"image"),0);glUniform2f(glGetUniformLocation(base,"extent"),width,height);glUniform1f(glGetUniformLocation(base,"direction"),direction);glDrawArrays(GL_TRIANGLES,0,3);
  glEnable(GL_BLEND);glBlendFunc(GL_SRC_ALPHA,GL_ONE_MINUS_SRC_ALPHA);glUseProgram(line);glUniform2f(glGetUniformLocation(line,"extent"),width,height);glUniform1f(glGetUniformLocation(line,"direction"),direction);glBindBuffer(GL_ARRAY_BUFFER,vbo);auto loc=glGetAttribLocation(line,"p");glEnableVertexAttribArray(loc);glVertexAttribPointer(loc,2,GL_FLOAT,GL_FALSE,0,nullptr);
  for(auto &r:c.rects){float data[]={r[0]*c.scale,r[1]*c.scale,r[2]*c.scale,r[1]*c.scale,r[2]*c.scale,r[3]*c.scale,r[0]*c.scale,r[3]*c.scale};glBufferData(GL_ARRAY_BUFFER,sizeof(data),data,GL_STATIC_DRAW);glDrawArrays(GL_LINE_LOOP,0,4);}glDisableVertexAttribArray(loc);
  glGenFramebuffers(1,&resolved);glBindFramebuffer(GL_DRAW_FRAMEBUFFER,resolved);glGenTextures(1,&tex);glBindTexture(GL_TEXTURE_2D,tex);glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA8,width,height,0,GL_RGBA,GL_UNSIGNED_BYTE,nullptr);glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,tex,0);if(glCheckFramebufferStatus(GL_DRAW_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete resolve");glBlitFramebuffer(0,0,width,height,0,0,width,height,GL_COLOR_BUFFER_BIT,GL_NEAREST);glBindFramebuffer(GL_FRAMEBUFFER,resolved);
  std::vector<unsigned char> raw(width*height*4);glReadPixels(0,0,width,height,GL_RGBA,GL_UNSIGNED_BYTE,raw.data());
  std::ofstream out(std::string(argv[1])+"/"+c.id+"-"+std::to_string(background)+"-"+std::to_string(direction)+".rgba",std::ios::binary);
  for(int y=0;y<height;y++){int row=direction>0?y:height-y-1;out.write((char*)raw.data()+row*width*4,width*4);}
  glDeleteTextures(1,&input);glDeleteTextures(1,&tex);glDeleteFramebuffers(1,&resolved);glDeleteRenderbuffers(1,&msaa);glDeleteFramebuffers(1,&fbo);
 }
 glDeleteBuffers(1,&vbo);glDeleteVertexArrays(1,&vao);glDeleteProgram(line);glDeleteProgram(base);CGLSetCurrentContext(nullptr);CGLDestroyContext(context);
}
