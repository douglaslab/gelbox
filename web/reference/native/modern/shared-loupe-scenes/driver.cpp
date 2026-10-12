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
 auto bands=program("#version 150\nin vec2 p;in vec4 c;out vec4 tint;void main(){gl_Position=vec4(p.x/400.*2.-1.,p.y/300.*2.-1.,0.,1.);tint=c;}","#version 150\nin vec4 tint;out vec4 color;void main(){color=tint;}");
 GLuint vao,vbo;glGenVertexArrays(1,&vao);glBindVertexArray(vao);glGenBuffers(1,&vbo);glBindBuffer(GL_ARRAY_BUFFER,vbo);
 for(auto &c:cases)for(int scale:{1,2}){
  int width=400*scale,height=300*scale;
  GLuint fbo,msaa,resolved,tex;glGenFramebuffers(1,&fbo);glBindFramebuffer(GL_FRAMEBUFFER,fbo);glGenRenderbuffers(1,&msaa);glBindRenderbuffer(GL_RENDERBUFFER,msaa);glRenderbufferStorageMultisample(GL_RENDERBUFFER,4,GL_RGBA8,width,height);glFramebufferRenderbuffer(GL_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_RENDERBUFFER,msaa);
  if(glCheckFramebufferStatus(GL_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete MSAA");
  glViewport(0,0,width,height);glDisable(GL_BLEND);glClearColor(1,1,1,1);glClear(GL_COLOR_BUFFER_BIT);
  glUseProgram(bands);glEnable(GL_BLEND);glBlendFunc(GL_SRC_ALPHA,GL_ONE_MINUS_SRC_ALPHA);
  auto draw=[&](const std::vector<float>& data,GLenum mode){
   glBufferData(GL_ARRAY_BUFFER,data.size()*sizeof(float),data.data(),GL_STATIC_DRAW);
   auto p=glGetAttribLocation(bands,"p"),color=glGetAttribLocation(bands,"c");glEnableVertexAttribArray(p);glEnableVertexAttribArray(color);
   glVertexAttribPointer(p,2,GL_FLOAT,GL_FALSE,6*sizeof(float),nullptr);glVertexAttribPointer(color,4,GL_FLOAT,GL_FALSE,6*sizeof(float),(void*)(2*sizeof(float)));
   glDrawArrays(mode,0,data.size()/6);glDisableVertexAttribArray(p);glDisableVertexAttribArray(color);
  };
  auto move=[](std::vector<float> data,float x,float y){for(size_t i=0;i<data.size();i+=6){data[i]+=x;data[i+1]+=y;}return data;};
  auto rect=[&](float x1,float y1,float x2,float y2,float r,float g,float b,float a){draw({x1,y1,r,g,b,a,x2,y1,r,g,b,a,x2,y2,r,g,b,a,x1,y1,r,g,b,a,x2,y2,r,g,b,a,x1,y2,r,g,b,a},GL_TRIANGLES);};
  auto sample=[&]{
   auto tint=[](std::vector<float> data,float gray,float alpha){for(size_t i=0;i<data.size();i+=6){data[i+2]=data[i+3]=data[i+4]=gray;data[i+5]=alpha;}return data;};
   if(!c.transient){
    bool active=c.focused||c.hover;auto ring=active?ring_focused:ring_idle;
    draw(move(move(tint(ring,0,active?.35f:.1f),c.ax-c.sx,c.ay-c.sy+2),c.sx,c.sy),GL_TRIANGLE_STRIP);
    draw(move(move(tint(ring,1,active?1:.6f),c.ax-c.sx,c.ay-c.sy),c.sx,c.sy),GL_TRIANGLE_STRIP);
   }
   // Convex hull for these left-anchor / inside-frame fixtures.
   std::vector<float> hull;
   auto point=[&](float x,float y){hull.insert(hull.end(),{x,y,1,1,1,.25f});};
   if(c.ax<c.sx)point(c.ax,c.ay);
   point(c.sx,c.sy);point(c.sx+c.sw,c.sy);point(c.sx+c.sw,c.sy+c.sh);point(c.sx,c.sy+c.sh);
   draw(hull,GL_TRIANGLE_FAN);draw(tint(hull,1,.15f),GL_LINE_LOOP);
   auto x=c.sx,y=c.sy,w=c.sw,h=c.sh;
   // SampleView::draw: shadow, background, then only the particles scissored.
   rect(x+2,y+4,x+w-2,y+h+4,0,0,0,c.focused?.25f:.15f);
   float shade=c.hover?.97f:1.f;rect(x,y,x+w,y+h,241/255.f*shade,241/255.f*shade,242/255.f*shade,1);
   // View.cpp truncates the logical extent before scaling; reflected raster.
   int bottom=int((300.f-(y+h))*scale),ch=int(int(h)*float(scale));
   glEnable(GL_SCISSOR_TEST);glScissor(int(x*scale),height-bottom-ch,int(int(w)*float(scale)),ch);
   draw(move(c.sample,x,y),GL_TRIANGLES);glDisable(GL_SCISSOR_TEST);
   if(c.focused){
    std::vector<float> focus;float a=2,b=w-2,cc=w;
    const float points[]={a,b,a,a,0,cc,0,0,a,a,b,a,0,0,cc,0,b,a,b,b,cc,0,cc,cc,b,b,a,b,cc,cc,0,cc};
    for(int i=0;i<32;i+=2)focus.insert(focus.end(),{points[i],points[i+1],0,0,1,.1f});
    draw(move(focus,x,y),GL_TRIANGLE_STRIP);
   }
   float gray=(c.focused||c.hover)?.4f:.8f;
   draw(move({0,0,gray,gray,gray,1,w,0,gray,gray,gray,1,w,h,gray,gray,gray,1,0,h,gray,gray,gray,1},x,y),GL_LINE_LOOP);
  };
  auto fragment=[&]{
   draw(move(shadow,c.fx,c.fy),GL_TRIANGLE_FAN);draw(move(fill,c.fx,c.fy),GL_TRIANGLE_FAN);
   glLineWidth(1);draw(move(stroke,c.fx,c.fy),GL_LINES);
   if(c.visible)draw(move(c.representative,c.fx,c.fy),GL_TRIANGLES);
  };
  rect(0,0,400,300,.1f,.2f,.35f,1);
  if(c.sampleLast){fragment();sample();}else{sample();fragment();}
  glGenFramebuffers(1,&resolved);glBindFramebuffer(GL_DRAW_FRAMEBUFFER,resolved);glGenTextures(1,&tex);glBindTexture(GL_TEXTURE_2D,tex);glTexImage2D(GL_TEXTURE_2D,0,GL_RGBA8,width,height,0,GL_RGBA,GL_UNSIGNED_BYTE,nullptr);glFramebufferTexture2D(GL_DRAW_FRAMEBUFFER,GL_COLOR_ATTACHMENT0,GL_TEXTURE_2D,tex,0);
  if(glCheckFramebufferStatus(GL_DRAW_FRAMEBUFFER)!=GL_FRAMEBUFFER_COMPLETE)throw std::runtime_error("incomplete resolve");
  glBlitFramebuffer(0,0,width,height,0,0,width,height,GL_COLOR_BUFFER_BIT,GL_NEAREST);glBindFramebuffer(GL_FRAMEBUFFER,resolved);
  std::vector<unsigned char> raw(width*height*4);glReadPixels(0,0,width,height,GL_RGBA,GL_UNSIGNED_BYTE,raw.data());
  std::ofstream out(std::string(argv[1])+"/"+c.id+"-"+std::to_string(scale)+".rgba",std::ios::binary);out.write((char*)raw.data(),raw.size());
  glDeleteTextures(1,&tex);glDeleteFramebuffers(1,&resolved);glDeleteRenderbuffers(1,&msaa);glDeleteFramebuffers(1,&fbo);
 }
 glDeleteBuffers(1,&vbo);glDeleteVertexArrays(1,&vao);glDeleteProgram(bands);CGLSetCurrentContext(nullptr);CGLDestroyContext(context);
}
