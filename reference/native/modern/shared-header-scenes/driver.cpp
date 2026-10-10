#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/ImageIo.h"
#include "cinder/Text.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
#include "layout.inc"
Layout gLayout;const Layout &kLayout=gLayout;
#include "layout-methods.inc"
struct SampleView {
 gl::TextureRef mMicrotubeIcon,mHeadingTex;Rectf mMicrotubeIconRect,mHeadingRect;int mHeadingScale;
 Rectf getBounds()const{return Rectf(0,0,200,200);}
 void drawHeader();
 void layout(){
#include "header-layout.inc"
 }
};
#include "header-method.inc"
int main(int argc,char** argv){
 if(argc!=3)throw runtime_error("tube asset and output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 nlohmann::json report=nlohmann::json::array();
 for(int scale:{1,2}){
  SampleView view;view.mHeadingScale=scale;
  view.mMicrotubeIcon=gl::Texture::create(loadImage(fs::path(argv[1])),gl::Texture2d::Format().mipmap());
  view.mHeadingTex=kLayout.renderHead(kLayout.mSampleViewHeaderStr,scale);view.layout();
  auto tex=view.mHeadingTex;tex->bind();int w=tex->getWidth(),h=tex->getHeight();
  vector<unsigned char> data(w*h*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,data.data());
  ofstream raw(fs::path(argv[2])/("sample-"+to_string(scale)+".rgba"),ios::binary);raw.write((char*)data.data(),data.size());
  GLint min=0,mag=0,level1Width=0;glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,&min);glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,&mag);glGetTexLevelParameteriv(GL_TEXTURE_2D,1,GL_TEXTURE_WIDTH,&level1Width);
  auto rect=[](Rectf r){return nlohmann::json::array({r.x1,r.y1,r.x2,r.y2});};
  report.push_back({{"scale",scale},{"width",w},{"height",h},{"topDown",tex->isTopDown()},{"uv",rect(tex->getAreaTexCoords(tex->getBounds()))},{"heading",rect(view.mHeadingRect)},{"tube",rect(view.mMicrotubeIconRect)},{"descent",Font(kLayout.mHeadFont,kLayout.mHeadFontSize).getDescent()},{"fontName",Font(kLayout.mHeadFont,kLayout.mHeadFontSize).getFullName()},{"minFilter",min},{"magFilter",mag},{"level1Width",level1Width}});
  auto fbo=gl::Fbo::create(320*scale,160*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(bool fractional:{false,true}){
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,320*scale,160*scale);gl::setMatricesWindow(320,160,false);gl::clear(ColorA(1,1,1,1));gl::enableAlphaBlending();gl::translate(fractional?vec2(40.25f,100.375f):vec2(40,100));view.drawHeader();}
   auto texture=fbo->getColorTexture();texture->bind();vector<unsigned char> pixels(320*scale*160*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
   ofstream output(fs::path(argv[2])/((fractional?"fractional-":"integer-")+to_string(scale)+".rgba"),ios::binary);output.write((char*)pixels.data(),pixels.size());
  }
 }
 ofstream meta(fs::path(argv[2])/"metrics.json");meta<<report.dump(2)<<'\n';
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
