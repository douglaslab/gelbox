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
struct EmptySim {
 int pickFragment(vec2)const{return -1;}
 void draw(int,int)const{}
 void drawBackground(int highlight){Color c=kLayout.mMolecularSimBkgndColor;if(highlight==1)c*=.97;if(highlight==2)c*=.9f;gl::color(c);gl::drawSolidRect(Rectf(0,0,200,171));}
};
struct SampleView {
 bool focused=false,hover=false,down=false,mHasLoupe=false,mIsLoupeView=false,mShowCalloutAnchor=false;
 PolyLine2f mCallout;EmptySim mMolecularSim;int mSelection=0,mRollover=0;
 bool getHasKeyboardFocus()const{return focused;}bool getHasRollover()const{return hover;}bool getHasMouseDown()const{return down;}
 void drawLoupe()const{} mat4 getParentToChildMatrix()const{return mat4(1);}
 vec2 rootToChild(vec2 p)const{return p;}vec2 getMouseLoc()const{return vec2(5);}
 ivec2 getScissorLowerLeftForBounds()const{return ivec2(0);}ivec2 getScissorSizeForBounds()const{return ivec2(800);}
 void draw();
 gl::TextureRef mMicrotubeIcon,mHeadingTex;Rectf mMicrotubeIconRect,mHeadingRect;int mHeadingScale;
 Rectf getBounds()const{return Rectf(0,0,200,171);}
 void drawHeader();
 void layout(){
#include "header-layout.inc"
 }
};
#include "header-method.inc"

#include "sample-draw.inc"
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
 if(argc!=3)throw runtime_error("asset directory and output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(fs::path(argv[1])/"cases.json");nlohmann::json cases;input>>cases;
 for(int scale:{1,2}){
  SampleView view;view.mHeadingScale=scale;
  view.mMicrotubeIcon=gl::Texture::create(loadImage(fs::path(argv[1])/"../shared-tube-scenes/microtube1500ul.png"),gl::Texture2d::Format().mipmap());
  view.mHeadingTex=kLayout.renderHead(kLayout.mSampleViewHeaderStr,scale);view.layout();
  ButtonView button;button.mImage=gl::Texture::create(loadImage(fs::path(argv[1])/(scale==1?"new-btn.png":"new-btn@2x.png")),gl::Texture2d::Format().mipmap());
  auto fbo=gl::Fbo::create(400*scale,400*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(const auto& c:cases){
   view.focused=c["focus"];view.hover=c["hover"];view.down=c["down"];button.hover=c["buttonHover"];button.down=c["buttonDown"];
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,400*scale);gl::setMatricesWindow(400,400,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
    auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(240,20),vec2(380,360),vec2(40,330));};
    if(!c["front"].get<bool>())triangle();
    {gl::ScopedModelMatrix transform;gl::translate(vec2(80.25f,110.75f));view.draw();gl::translate(vec2(200-32,171+kLayout.mBtnGutter));button.draw();}
    if(c["front"].get<bool>())triangle();
   }
   auto texture=fbo->getColorTexture();texture->bind();vector<unsigned char> pixels(400*scale*400*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
   ofstream output(fs::path(argv[2])/(c["id"].get<string>()+"-"+to_string(scale)+".rgba"),ios::binary);output.write((char*)pixels.data(),pixels.size());
  }
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
