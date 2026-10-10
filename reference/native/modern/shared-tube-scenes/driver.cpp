#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/ImageIo.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
#include "layout.inc"
Layout gLayout;const Layout &kLayout=gLayout;
#include "snap-methods.inc"
struct Gel {int lanes;int getNumLanes()const{return lanes;}};
struct GelView {
 Gel *mGel;gl::TextureRef mMicrotubeIcon;int mSelectedMicrotube=-1,mMouseDownMicrotube=0;
 enum class Drag {None,Sample};Drag mDrag=Drag::None;vec2 mouse,down;vector<int> loaded;
 Rectf getBounds()const{return Rectf(0,0,390,520);}
 void *getSample(int i)const{return find(loaded.begin(),loaded.end(),i)!=loaded.end()?(void*)mGel:nullptr;}
 vec2 getMouseLoc()const{return mouse;}vec2 getMouseDownLoc()const{return down;}vec2 rootToChild(vec2 p)const{return p;}
 Rectf snapToPixel(Rectf r)const{return kLayout.snapToPixel(r);}
 Rectf calcMicrotubeWellRect(int,float *cornerRadius=nullptr)const;Rectf calcMicrotubeIconRect(Rectf)const;
 int pickMicrotube(vec2)const;void drawMicrotubes()const;void drawDragMicrotube()const;
};
#include "tube-methods.inc"
int main(int argc,char** argv){
 if(argc!=4)throw runtime_error("asset directory, cases JSON, output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(argv[2]);nlohmann::json cases;input>>cases;
 for(const auto& c:cases)for(int scale:{1,2}){
  Gel gel;gel.lanes=c["lanes"];GelView view;view.mGel=&gel;view.loaded=c["loaded"].get<vector<int>>();view.mSelectedMicrotube=c["selected"];
  view.mMicrotubeIcon=gl::Texture::create(loadImage(fs::path(argv[1])/"microtube1500ul.png"),gl::Texture2d::Format().mipmap());
  if(c.contains("mouse")){view.mDrag=GelView::Drag::Sample;view.mouse=vec2(c["mouse"][0],c["mouse"][1]);view.down=vec2(c["down"][0],c["down"][1]);}
  auto fbo=gl::Fbo::create(500*scale,680*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,500*scale,680*scale);gl::setMatricesWindow(500,680,false);gl::clear(ColorA(1,1,1,1));gl::enableAlphaBlending();gl::translate(vec2(50,90));
   view.drawMicrotubes();gl::color(0,0,0,1);gl::drawSolidRect(view.getBounds());view.drawDragMicrotube();
  }
  nlohmann::json geometry=nlohmann::json::array();for(int i=0;i<gel.lanes;i++){auto r=view.calcMicrotubeIconRect(view.calcMicrotubeWellRect(i));geometry.push_back({r.x1,r.y1,r.x2,r.y2});}
  ofstream geo(fs::path(argv[3])/(c["id"].get<string>()+"-"+to_string(scale)+".geometry.json"));geo<<geometry.dump();
  auto texture=fbo->getColorTexture();texture->bind();vector<unsigned char> data(500*scale*680*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,data.data());
  ofstream output(fs::path(argv[3])/(c["id"].get<string>()+"-"+to_string(scale)+".rgba"),ios::binary);output.write((char*)data.data(),data.size());
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
