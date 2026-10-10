#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/ImageIo.h"
#include "cinder/Json.h"
#include "cinder/Text.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
#include "layout.inc"
Layout gLayout;const Layout& kLayout=gLayout;
#include "snap.inc"
#include "ButtonView.h"
#include "CheckboxView.h"
#include "AppSettingsView.h"
int currentScale=1;fs::path assets;
float nativeContentScale(){return currentScale;}
struct GelView {bool value=false;bool isGelRenderEnabled(){return value;}bool isLoupeOnHoverEnabled(){return value;}void enableGelRender(bool){}void enableLoupeOnHover(bool){}};
struct GelboxApp{bool selected=false;static GelboxApp* instance(){static GelboxApp a;return &a;}bool isSampleSelected(){return selected;}void promptUserToSaveSelectedSample(){}void promptUserToSaveGel(){}void promptUserToOpenFile(){}void closeSettingsMenu(){}};
const ColorA kDisableColor(.5f,.5f,.5f,.5f);
gl::TextureRef Layout::uiImage(string name,int* scale)const{*scale=currentScale;fs::path p(name);if(currentScale==2)p=p.stem().string()+"@2x"+p.extension().string();return gl::Texture2d::create(loadImage(assets/p),gl::Texture2d::Format().mipmap());}
#include "menu-methods.inc"
int main(int argc,char**argv){
 if(argc!=3)throw runtime_error("reference and output directories required");assets=argv[1];
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(assets/"cases.json");nlohmann::json cases;input>>cases;
 for(int scale:{1,2}){
  currentScale=scale;nlohmann::json textures=nlohmann::json::array();
  auto record=[&](string id,gl::TextureRef tex,Rectf rect,Rectf frame){
   gl::ScopedTextureBind binding(tex);int w=tex->getWidth(),h=tex->getHeight();vector<unsigned char> rgba(w*h*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,rgba.data());
   ofstream raw(fs::path(argv[2])/(id+"-"+to_string(scale)+".rgba"),ios::binary);raw.write((char*)rgba.data(),rgba.size());
   textures.push_back({{"id",id},{"size",{w,h}},{"topDown",tex->isTopDown()},{"rect",{rect.x1,rect.y1,rect.x2,rect.y2}},{"frame",{frame.x1,frame.y1,frame.x2,frame.y2}}});
  };
  auto fbo=gl::Fbo::create(400*scale,240*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(const auto& c:cases){
   GelboxApp::instance()->selected=c["selected"];auto gel=make_shared<GelView>();gel->value=c["checked"];auto menu=make_shared<AppSettingsView>();menu->setup(gel);
   for(int i=0;i<menu->children.size();i++){
    auto child=menu->children[i];child->hover=c["hover"];child->down=c["down"];child->inside=c["inside"];
    if(c["id"]=="selected"){
     if(auto check=dynamic_pointer_cast<CheckboxView>(child))record("menu-check-"+to_string(i),check->mLabel,check->mLabelRect,check->getFrame());
     else if(auto button=dynamic_pointer_cast<ButtonView>(child))record("menu-button-"+to_string(i),button->mImage,button->getBounds(),button->getFrame());
    }
   }
   for(bool front:{false,true}){
    {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,240*scale);gl::setMatricesWindow(400,240,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
     auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(100,15),vec2(380,220),vec2(15,210));};if(!front)triangle();
     {gl::ScopedModelMatrix transform;gl::translate(vec2(60.25f,220.75f));menu->draw();for(auto child:menu->children){gl::ScopedModelMatrix local;gl::translate(child->getFrame().getUpperLeft()-child->getBounds().getUpperLeft());child->draw();}}
     if(front)triangle();
    }
    auto tex=fbo->getColorTexture();gl::ScopedTextureBind readback(tex);vector<unsigned char> pixels(400*scale*240*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
    ofstream raw(fs::path(argv[2])/(c["id"].get<string>()+(front?"-front-":"-behind-")+to_string(scale)+".rgba"),ios::binary);raw.write((char*)pixels.data(),pixels.size());
   }
  }
  ofstream meta(fs::path(argv[2])/("metrics-"+to_string(scale)+".json"));meta<<textures.dump(2)<<'\n';
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
