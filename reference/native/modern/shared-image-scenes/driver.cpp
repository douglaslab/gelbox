#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/ImageIo.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
struct ImageView {
 gl::TextureRef mImage;Rectf frame;bool focused;
 Rectf getBounds()const{return Rectf(0,0,mImage->getWidth(),mImage->getHeight());}
 Rectf getFrame()const{return frame;}
 bool getHasKeyboardFocus()const{return focused;}
 void draw();void drawFrame();Rectf calcResizeBox()const;
};
#include "image-methods.inc"
int main(int argc,char** argv){
 if(argc!=4)throw runtime_error("asset directory, cases JSON, output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(argv[2]);nlohmann::json cases;input>>cases;
 for(const auto& c:cases)for(int scale:{1,2}){
  ImageView image;image.mImage=gl::Texture::create(loadImage(fs::path(argv[1])/(c["asset"].get<string>()+".png")),gl::Texture2d::Format().mipmap());
  auto r=c["frame"];image.frame=Rectf(r[0],r[1],r[2],r[3]);image.focused=c["focused"];
  auto fbo=gl::Fbo::create(400*scale,300*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,300*scale);gl::setMatricesWindow(400,300,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
   auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(70,30),vec2(260,210),vec2(40,220));};
   if(!c["front"].get<bool>())triangle();
   {gl::ScopedModelMatrix transform;gl::translate(image.frame.getUpperLeft());gl::scale(image.frame.getWidth()/image.mImage->getWidth(),image.frame.getHeight()/image.mImage->getHeight());image.draw();}
   image.drawFrame();if(c["front"].get<bool>())triangle();
  }
  auto texture=fbo->getColorTexture();texture->bind();vector<unsigned char> data(400*scale*300*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,data.data());
  ofstream output(fs::path(argv[3])/(c["id"].get<string>()+"-"+to_string(scale)+".rgba"),ios::binary);output.write((char*)data.data(),data.size());
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
