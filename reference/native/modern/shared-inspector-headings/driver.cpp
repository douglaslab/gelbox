#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/Text.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
#include "layout.inc"
Layout gLayout;const Layout &kLayout=gLayout;
#include "layout-methods.inc"
struct GelSettingsView {
 gl::TextureRef mBraceTex,mHeadingTex;Rectf mBraceRect,mHeadingRect;int mHeadingScale;
 void draw();void layout(){
#include "gel-settings-layout.inc"
 }
};
struct SampleSettingsView {
 gl::TextureRef mBraceTex,mHeadingTex,mSubheadTex;Rectf mBraceRect,mHeadingRect,mSubheadRect;int mTextContentScale;
 Rectf snapToPixel(Rectf r)const{return kLayout.snapToPixel(r);}
 void draw();void layout(){
#include "sample-settings-layout.inc"
 }
};
struct FragmentView {gl::TextureRef mHeadingTex;Rectf mHeadingRect;void draw();};
#include "draw-methods.inc"
int main(int argc,char** argv){
 if(argc!=2)throw runtime_error("output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 nlohmann::json metrics;
 for(int scale:{1,2}){
  GelSettingsView gel;gel.mHeadingScale=scale;gel.mHeadingTex=kLayout.renderHead(kLayout.mGelSettingsHeaderStr,scale);gel.layout();
  SampleSettingsView sample;sample.mTextContentScale=scale;sample.mHeadingTex=kLayout.renderHead(kLayout.mSampleSettingsHeaderStr,scale);sample.mSubheadTex=kLayout.renderSubhead("Dyes",scale);sample.layout();
  FragmentView fragment;fragment.mHeadingTex=kLayout.renderHead(kLayout.mFragViewHeaderStr,scale);fragment.mHeadingRect=kLayout.layoutHeadingText(fragment.mHeadingTex,kLayout.mFragViewHeaderBaselinePos,scale);
  auto record=[&](string kind,string id,gl::TextureRef tex,Rectf r){
   tex->bind();int w=tex->getWidth(),h=tex->getHeight();vector<unsigned char> bytes(w*h*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,bytes.data());
   GLint min=0,mag=0,level1Width=0;glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,&min);glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,&mag);glGetTexLevelParameteriv(GL_TEXTURE_2D,1,GL_TEXTURE_WIDTH,&level1Width);
   if(min!=GL_LINEAR||mag!=GL_LINEAR||level1Width)throw runtime_error("unexpected text sampling");
   ofstream raw(fs::path(argv[1])/(id+"-"+to_string(scale)+".rgba"),ios::binary);raw.write((char*)bytes.data(),bytes.size());
   metrics[kind][to_string(scale)]["textures"].push_back({{"id",id},{"size",{w,h}},{"topDown",tex->isTopDown()},{"rect",{r.x1,r.y1,r.x2,r.y2}}});
  };
  record("gel-settings","gel-heading",gel.mHeadingTex,gel.mHeadingRect);
  record("sample-settings","dyes-subhead",sample.mSubheadTex,sample.mSubheadRect);
  record("sample-settings","sample-settings-heading",sample.mHeadingTex,sample.mHeadingRect);
  record("fragment","fragment-heading",fragment.mHeadingTex,fragment.mHeadingRect);
  auto rule=[&](string kind,vec2 p,float w){metrics[kind][to_string(scale)]["rule"]={p.x,p.y,p.x+w,p.y};};
  rule("gel-settings",kLayout.mGelSettingsRuleTopLeft,kLayout.mGelSettingsRuleLength);rule("sample-settings",kLayout.mSampleSettingsRuleTopLeft,kLayout.mSampleSettingsRuleLength);
  auto fbo=gl::Fbo::create(400*scale,460*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(string kind:{"gel-settings","sample-settings","fragment"})for(bool front:{false,true}){
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,460*scale);gl::setMatricesWindow(400,460,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
    auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(150,15),vec2(380,450),vec2(20,430));};
    if(!front)triangle();
    {gl::ScopedModelMatrix transform;gl::translate(vec2(40.25f,80.75f));if(kind=="gel-settings")gel.draw();else if(kind=="sample-settings")sample.draw();else fragment.draw();}
    if(front)triangle();
   }
   auto texture=fbo->getColorTexture();texture->bind();vector<unsigned char> pixels(400*scale*460*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
   ofstream output(fs::path(argv[1])/(kind+(front?"-front-":"-behind-")+to_string(scale)+".rgba"),ios::binary);output.write((char*)pixels.data(),pixels.size());
  }
 }
 ofstream meta(fs::path(argv[1])/"metrics.json");meta<<metrics.dump(2)<<'\n';
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
