#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/ImageIo.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
struct Layout {ColorA mBtnHoverColor=ColorA(.9,.9,.9,1),mBtnDownColor=ColorA(.7,.7,.7,1),mDebugDrawLayoutGuideColor=ColorA(1,0,0,1);bool mDebugDrawLayoutGuides=false;} kLayout;
const ColorA kDisableColor(.5,.5,.5,.5);
struct ButtonView {
 gl::TextureRef mImage;bool hover=false,down=false;
 ColorA mFillColor=ColorA(0,0,0,0),mFrameColor=ColorA(0,0,0,0);float mRectCornerRadius=0;
 Rectf getBounds()const{return Rectf(0,0,32,32);}
 bool getHasRollover()const{return hover;}bool getHasMouseDown()const{return down;}
 vec2 getMouseLoc()const{return vec2(16,16);}bool pick(vec2)const{return true;}bool isEnabled()const{return true;}
 ColorA stateColor(ColorA,ColorA)const;void draw();void drawFrame()const;void drawFill()const;
};
#include "button-methods.inc"
int main(int argc,char** argv){
 if(argc!=4)throw runtime_error("asset directory, cases JSON, output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(argv[2]);nlohmann::json cases;input>>cases;
 for(const auto& c:cases)for(int scale:{1,2}){
  ButtonView button;button.hover=c["hover"];button.down=c["down"];
  button.mImage=gl::Texture::create(loadImage(fs::path(argv[1])/(scale==2?"settings@2x.png":"settings.png")),gl::Texture2d::Format().mipmap());
  auto fbo=gl::Fbo::create(400*scale,300*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,300*scale);gl::setMatricesWindow(400,300,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
   auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(70,30),vec2(260,210),vec2(40,220));};
   if(!c["front"].get<bool>())triangle();
   {gl::ScopedModelMatrix transform;gl::translate(vec2(80.25,50.75));button.draw();}if(c["front"].get<bool>())triangle();
  }
  auto texture=fbo->getColorTexture();texture->bind();vector<unsigned char> data(400*scale*300*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,data.data());
  ofstream output(fs::path(argv[3])/(c["id"].get<string>()+"-"+to_string(scale)+".rgba"),ios::binary);output.write((char*)data.data(),data.size());
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
