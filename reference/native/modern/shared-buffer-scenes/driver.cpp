#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/gl/TextureFont.h"
#include "cinder/ImageIo.h"
#include "cinder/Json.h"
#include "cinder/Text.h"
#include "cinder/Utilities.h"
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
struct Config {bool mEnableBufferSlides=false;} kConfig;
struct GelboxApp {
 gl::TextureFontRef fonts[2];
 static GelboxApp* instance(){static GelboxApp app;return &app;}
 gl::TextureFontRef getUIFont(float scale,int* chosen){*chosen=scale>=2?2:1;return fonts[*chosen-1];}
};
#include "slider-methods.inc"
#include "buffer.inc"
#include "layout-methods.inc"
struct SliderView;
using SliderViewRef=shared_ptr<SliderView>;
struct SliderView {
 Slider mSlider;Rectf frame,bounds;
 explicit SliderView(Slider slider){setSlider(slider);}
 Slider getSlider()const{return mSlider;}
 void setSlider(Slider slider){mSlider=slider;setFrameAndBoundsWithSlider();}
 Rectf getFrame()const{return frame;}
 void setFrame(Rectf r){frame=r;}void setBounds(Rectf r){bounds=r;}
 vec2 childToParent(vec2 p)const{return p-bounds.getUpperLeft()+frame.getUpperLeft();}
 void setFrameAndBoundsWithSlider();
 static void layoutSlidersFromBar(vector<SliderViewRef>,vec2,float,vec2,float);
};
#include "slider-view-methods.inc"
struct BufferView {
 vector<SliderViewRef> mSliders;int mTextContentScale=1,mPresetSelection=-1;
 gl::TextureRef mHeadingTex;vector<gl::TextureRef> mPresetLabel;
 Rectf mHeadingRect,mPresetsRect;vector<Rectf> mPresetLabelRect;
 Rectf getBounds()const{return Rectf(vec2(0),kLayout.mBufferViewSize);}
 void updateLayout();void draw();
 void setupText(){
#include "buffer-text.inc"
 }
};
#include "buffer-methods.inc"
int main(int argc,char** argv){
 if(argc!=3)throw runtime_error("reference and output directories required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(fs::path(argv[1])/"cases.json");nlohmann::json cases;input>>cases;
 for(int scale:{1,2}){
  currentScale=scale;GelboxApp::instance()->fonts[scale-1]=gl::TextureFont::create(Font(kLayout.mUIFont,kLayout.mUIFontSize*scale));
  BufferView view;view.mTextContentScale=scale;view.setupText();
  nlohmann::json textures=nlohmann::json::array();
  Font labelFont(kLayout.mBufferViewSliderLabelFont,kLayout.mBufferViewSliderLabelFontSize*scale);int labelFontScale=scale;
  for(int param=0;param<Gelbox::Buffer::kNumParams;param++){
   Slider s;s.mValueMappedLo=0;s.mValueMappedHi=Gelbox::kBufferParamMax[param];
#include "buffer-style.inc"
#include "buffer-format.inc"
   string iconName=Gelbox::kBufferParamIconName[param]+(scale==2?"@2x":"")+".png";int iconScale=scale;
   if(!fs::exists(fs::path(argv[1])/iconName)){iconName=Gelbox::kBufferParamIconName[param]+".png";iconScale=1;}
   s.setIcon(1,gl::Texture2d::create(loadImage(fs::path(argv[1])/iconName),gl::Texture2d::Format().mipmap()),iconScale);
#include "buffer-label.inc"
   view.mSliders.push_back(make_shared<SliderView>(s));
  }
  view.updateLayout();
  auto record=[&](string id,gl::TextureRef tex,Rectf rect){
   tex->bind();int w=tex->getWidth(),h=tex->getHeight();vector<unsigned char> rgba(w*h*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,rgba.data());
   string name=id+"-"+to_string(scale);ofstream raw(fs::path(argv[2])/(name+".rgba"),ios::binary);raw.write((char*)rgba.data(),rgba.size());
   GLint min=0,mag=0,level1=0;glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,&min);glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,&mag);glGetTexLevelParameteriv(GL_TEXTURE_2D,1,GL_TEXTURE_WIDTH,&level1);if(min!=GL_LINEAR||mag!=GL_LINEAR||level1)throw runtime_error("label sampling");
   textures.push_back({{"id",id},{"size",{w,h}},{"topDown",tex->isTopDown()},{"rect",{rect.x1,rect.y1,rect.x2,rect.y2}}});
  };
  record("buffer-heading",view.mHeadingTex,view.mHeadingRect);
  for(int i=0;i<3;i++)record("buffer-preset-"+to_string(i),view.mPresetLabel[i],view.mPresetLabelRect[i]);
  for(int i=0;i<4;i++)record("buffer-label-"+to_string(i),view.mSliders[i]->mSlider.mIcon[0],view.mSliders[i]->mSlider.mIconRect[0]);
  ofstream meta(fs::path(argv[2])/("metrics-"+to_string(scale)+".json"));meta<<textures.dump(2)<<'\n';
  auto fbo=gl::Fbo::create(400*scale,240*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(const auto& c:cases)for(bool front:{false,true}){
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,240*scale);gl::setMatricesWindow(400,240,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
    auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(100,15),vec2(380,220),vec2(15,210));};if(!front)triangle();
    {gl::ScopedModelMatrix transform;gl::translate(vec2(60.25f,40.75f));view.mPresetSelection=c["selected"];view.draw();
     for(int i=0;i<4;i++){
      auto child=view.mSliders[i];auto s=child->mSlider;s.mValue=s.calcNormalizedValue(c["values"][i]);
      if(!c["notches"].empty())s.addNotchAtMappedValue(c["notches"][i]);
      gl::ScopedModelMatrix childTransform;gl::translate(child->childToParent(vec2(0)));s.draw();
     }
    }if(front)triangle();
   }
   auto tex=fbo->getColorTexture();tex->bind();vector<unsigned char> pixels(400*scale*240*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
   ofstream raw(fs::path(argv[2])/(c["id"].get<string>()+(front?"-front-":"-behind-")+to_string(scale)+".rgba"),ios::binary);raw.write((char*)pixels.data(),pixels.size());
  }
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
