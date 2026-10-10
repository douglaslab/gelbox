#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/gl/TextureFont.h"
#include "cinder/ImageIo.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
#include "layout.inc"
Layout gLayout;const Layout& kLayout=gLayout;
#include "snap.inc"
#include "slider.inc"
int currentScale=1;
float nativeContentScale(){return currentScale;}
struct GelboxApp {
 gl::TextureFontRef fonts[2];
 static GelboxApp* instance(){static GelboxApp app;return &app;}
 gl::TextureFontRef getUIFont(float scale,int* chosen){*chosen=scale>=2?2:1;return fonts[*chosen-1];}
};
#include "slider-methods.inc"
int main(int argc,char** argv){
 if(argc!=3)throw runtime_error("reference and output directories required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(fs::path(argv[1])/"cases.json");nlohmann::json cases;input>>cases;
 for(int scale:{1,2}){
  currentScale=scale;GelboxApp::instance()->fonts[scale-1]=gl::TextureFont::create(Font(kLayout.mUIFont,kLayout.mUIFontSize*scale));
  gl::TextureRef icons[2];for(int i=0;i<2;i++)icons[i]=gl::Texture2d::create(loadImage(fs::path(argv[1])/(string(i?"clock-hi":"clock-lo")+(scale==2?"@2x":"")+".png")),gl::Texture2d::Format().mipmap());
  auto fbo=gl::Fbo::create(400*scale,170*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(const auto& c:cases)for(bool front:{false,true}){
   Slider slider;string style=c["style"];slider.mStyle=style=="slider"?Slider::Style::Slider:style=="bar"?Slider::Style::Bar:Slider::Style::Graph;
   slider.mValue=c["value"];slider.mEnabled=c["enabled"];slider.mNotches=c["notches"].get<vector<float>>();slider.mNotchAction=Slider::Notch::DrawOnly;slider.mGraphValues=c["graph"].get<vector<float>>();
   slider.mBarCornerRadius=4;slider.mBarFillColor=ColorA(.3,.6,.8,1);slider.mBarEmptyColor=ColorA(.85,.9,.95,1);slider.mTextLabelColor=ColorA(.2,.2,.2,1);
   string label=c["label"];if(!label.empty())slider.mMappedValueToStr=[label](float){return label;};
   for(int i=0;i<2;i++)slider.setIcon(i,icons[i],scale);
   if(style=="bar")slider.doLayoutFromBar(vec2(120,23),8);else slider.doLayoutInWidth(217,16,vec2(26,26));
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,170*scale);gl::setMatricesWindow(400,170,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
    auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(80,15),vec2(340,155),vec2(30,150));};if(!front)triangle();
    {gl::ScopedModelMatrix transform;gl::translate(vec2(60.25f,50.75f));slider.draw(c["highlight"]);}if(front)triangle();
   }
   auto tex=fbo->getColorTexture();tex->bind();vector<unsigned char> pixels(400*scale*170*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
   ofstream raw(fs::path(argv[2])/(c["id"].get<string>()+(front?"-front-":"-behind-")+to_string(scale)+".rgba"),ios::binary);raw.write((char*)pixels.data(),pixels.size());
  }
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
