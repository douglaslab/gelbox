#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
struct SampleFragRef {int sample,fragment;SampleFragRef(int s,int f):sample(s),fragment(f){}bool operator==(const SampleFragRef& r)const{return sample==r.sample&&fragment==r.fragment;}};
struct Band {int mLane,mFragment;Rectf mUIRect;Color mFocusColor;};
struct Gel {vector<Band> bands;const vector<Band>& getBands()const{return bands;}};
struct GelView {shared_ptr<Gel> mGel;shared_ptr<SampleFragRef> mSelectedState,mRolloverState;int getSample(int lane)const{return lane;}void drawBandFocus()const;};
#include "focus-method.inc"
int main(int argc,char**argv){
 if(argc!=3)throw runtime_error("reference and output directories required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(fs::path(argv[1])/"cases.json");nlohmann::json cases;input>>cases;
 for(int scale:{1,2}){
  auto fbo=gl::Fbo::create(400*scale,240*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(const auto& c:cases)for(bool front:{false,true}){
   GelView view;view.mGel=make_shared<Gel>();view.mSelectedState=make_shared<SampleFragRef>(c["selected"][0],c["selected"][1]);view.mRolloverState=make_shared<SampleFragRef>(c["hover"][0],c["hover"][1]);
   for(const auto& b:c["bands"])view.mGel->bands.push_back({b["sample"],b["fragment"],Rectf(b["rect"][0],b["rect"][1],b["rect"][2],b["rect"][3]),Color(b["color"][0],b["color"][1],b["color"][2])});
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,240*scale);gl::setMatricesWindow(400,240,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
    auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(100,15),vec2(380,220),vec2(15,210));};if(!front)triangle();
    {gl::ScopedModelMatrix transform;gl::translate(vec2(60.25f,40.75f));gl::color(ColorA(.05,.05,.05,1));gl::drawSolidRect(Rectf(0,0,280,160));
     // Native lower-left scissor converted to this positive-Y capture/readback axis.
     gl::ScopedScissor clip(ivec2(int(60.25f*scale),240*scale-int((240.f-(40.75f+160.f))*scale)-160*scale),ivec2(280*scale,160*scale));view.drawBandFocus();
    }if(front)triangle();
   }
   auto tex=fbo->getColorTexture();gl::ScopedTextureBind readback(tex);vector<unsigned char> pixels(400*scale*240*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
   ofstream raw(fs::path(argv[2])/(c["id"].get<string>()+(front?"-front-":"-behind-")+to_string(scale)+".rgba"),ios::binary);raw.write((char*)pixels.data(),pixels.size());
  }
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
