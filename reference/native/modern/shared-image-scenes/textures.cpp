#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/ImageIo.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
int main(int argc,char** argv){
 if(argc<3)throw std::runtime_error("input PNGs and output JSON required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw std::runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw std::runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 ci::gl::Environment::setCore();auto context=ci::gl::Context::createFromExisting(std::make_shared<ci::gl::PlatformDataMac>(cgl));context->makeCurrent();
 std::ofstream out(argv[argc-1]);out<<'[';
 for(int arg=1;arg<argc-1;arg++){
  if(arg>1)out<<',';
  auto source=ci::loadImage(ci::fs::path(argv[arg]));
  auto texture=ci::gl::Texture2d::create(source,ci::gl::Texture2d::Format().mipmap());
  texture->bind();out<<"{\"premultipliedSource\":"<<(source->isPremultiplied()?"true":"false")<<",\"levels\":[";
  for(int level=0;;level++){
   GLint w=0,h=0;glGetTexLevelParameteriv(GL_TEXTURE_2D,level,GL_TEXTURE_WIDTH,&w);glGetTexLevelParameteriv(GL_TEXTURE_2D,level,GL_TEXTURE_HEIGHT,&h);if(!w||!h)break;
   if(level)out<<',';std::vector<unsigned char> rgba(w*h*4);glGetTexImage(GL_TEXTURE_2D,level,GL_RGBA,GL_UNSIGNED_BYTE,rgba.data());
   out<<"{\"width\":"<<w<<",\"height\":"<<h<<",\"rgba\":[";for(size_t i=0;i<rgba.size();i++){if(i)out<<',';out<<int(rgba[i]);}out<<"]}";
   if(w==1&&h==1)break;
  }
  out<<"]}";
 }
 out<<"]\n";
 std::cout<<glGetString(GL_RENDERER)<<"\n";
}
