#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/gl/TextureFont.h"
#include "cinder/cocoa/CinderCocoa.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <CoreText/CoreText.h>
#include <fstream>
#include <iostream>
#include <random>
using namespace ci;using namespace std;
#include "layout.inc"
Layout gLayout;const Layout &kLayout=gLayout;
struct NativeLine {vector<CGGlyph> glyphs;vector<CGPoint> positions;double width,ascent,descent,leading;};
NativeLine rawLine(const Font& font,const string& text){
 auto attr=cocoa::createCfAttributedString(text,font,ColorA(1,1,1,1),false);
 auto setter=CTTypesetterCreateWithAttributedString(attr);auto line=CTTypesetterCreateLine(setter,CFRangeMake(0,CFAttributedStringGetLength(attr)));
 NativeLine result;result.width=CTLineGetTypographicBounds(line,&result.ascent,&result.descent,&result.leading);
 auto runs=CTLineGetGlyphRuns(line);for(CFIndex i=0;i<CFArrayGetCount(runs);i++){
  auto run=(CTRunRef)CFArrayGetValueAtIndex(runs,i);auto n=CTRunGetGlyphCount(run);size_t offset=result.glyphs.size();result.glyphs.resize(offset+n);result.positions.resize(offset+n);
  CTRunGetGlyphs(run,CFRangeMake(0,0),result.glyphs.data()+offset);CTRunGetPositions(run,CFRangeMake(0,0),result.positions.data()+offset);
 }
 CFRelease(line);CFRelease(setter);CFRelease(attr);return result;
}
int main(int argc,char** argv){
 if(argc!=2)throw runtime_error("output directory required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 nlohmann::json metrics,oracle,textureReports;
 vector<string> labels={"3:00","0:00","0:01","1:59","70 V","-300 V","300 V","7","20","14,000 bp","100 bp","175 ng","1 ng","16 : 1","89.0 mM","0.0 mM","0.5 mM","1e+06 bp","nan mM","inf mM","-0 mM","AV To Wa fi fl",". , : ; + - / %"};
 vector<string> strings=labels;strings.push_back("");mt19937 rng(513);
 for(int i=0;i<1000;i++){
  string s;int n=1+rng()%25;for(int j=0;j<n;j++)s+=char(32+rng()%95);strings.push_back(s);
 }
 for(int scale:{1,2}){
  Font font(kLayout.mUIFont,kLayout.mUIFontSize*scale);auto face=gl::TextureFont::create(font);string sk=to_string(scale);
  auto &meta=metrics[sk];meta["font"]=font.getFullName();meta["ascent"]=font.getAscent();meta["descent"]=font.getDescent();meta["lineHeight"]=face->measureString("M").y;meta["kerning"]=nlohmann::json::object();
  for(int c=32;c<127;c++){
   string str(1,char(c));auto line=rawLine(font,str);if(line.glyphs.size()!=1)throw runtime_error("single ASCII glyph expected");
   meta["characters"][str]={{"glyph",line.glyphs[0]},{"advance",line.width},{"x",line.positions[0].x},{"y",line.positions[0].y}};
  }
  for(int a=32;a<127;a++)for(int b=32;b<127;b++){
   string str;str+=char(a);str+=char(b);auto line=rawLine(font,str);
   if(line.glyphs.size()!=2)throw runtime_error("ASCII pair ligated");
   double advance=meta["characters"][string(1,char(a))]["advance"],kern=line.positions[1].x-advance;
   if(abs(kern)>1e-10)meta["kerning"][str]=kern;
  }
  for(const auto& [glyph,info]:face->getGlyphMap())meta["glyphs"][to_string(glyph)]={{"atlas",info.mTextureIndex},{"area",{info.mTexCoords.x1,info.mTexCoords.y1,info.mTexCoords.x2,info.mTexCoords.y2}},{"origin",{info.mOriginOffset.x,info.mOriginOffset.y}}};
  int index=0;
  for(auto tex:face->getTextures()){
   tex->bind();int w=tex->getWidth(),h=tex->getHeight();GLint swizzle[4],min=0,mag=0,level1=0;glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_SWIZZLE_RGBA,swizzle);glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,&min);glGetTexParameteriv(GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,&mag);glGetTexLevelParameteriv(GL_TEXTURE_2D,1,GL_TEXTURE_WIDTH,&level1);
   if(swizzle[0]!=GL_RED||swizzle[1]!=GL_RED||swizzle[2]!=GL_RED||swizzle[3]!=GL_GREEN||min!=GL_LINEAR||mag!=GL_LINEAR||level1||!tex->isTopDown())throw runtime_error("unexpected atlas format");
   vector<unsigned char> rg(w*h*2),rgba(w*h*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RG,GL_UNSIGNED_BYTE,rg.data());
   for(int i=0;i<w*h;i++){rgba[i*4]=rgba[i*4+1]=rgba[i*4+2]=rg[i*2];rgba[i*4+3]=rg[i*2+1];}
   string name="atlas-"+sk+"-"+to_string(index);ofstream raw(fs::path(argv[1])/(name+".rgba"),ios::binary);raw.write((char*)rgba.data(),rgba.size());
   meta["atlases"].push_back({{"name",name},{"width",w},{"height",h}});index++;
  }
  for(const string& s:strings){
   auto size=face->measureString(s);nlohmann::json placements=nlohmann::json::array();for(auto [glyph,p]:face->getGlyphPlacements(s))placements.push_back({glyph,p.x,p.y});
   oracle[sk].push_back({{"text",s},{"size",{size.x,size.y}},{"placements",placements}});
  }
  auto fbo=gl::Fbo::create(480*scale,620*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(bool front:{false,true}){
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,480*scale,620*scale);gl::setMatricesWindow(480,620,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
    auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(160,10),vec2(440,590),vec2(10,570));};if(!front)triangle();
    {gl::ScopedModelMatrix transform;gl::translate(vec2(40.25f,20.75f));for(size_t i=0;i<labels.size();i++){
     gl::color(i%2?ColorA(.2f,.2f,.2f,1):ColorA(.9f,.85f,.7f,.8f));face->drawString(labels[i],vec2(20.375f,20.625f+float(i)*25),gl::TextureFont::DrawOptions().scale(1.f/scale));
    }}if(front)triangle();
   }
   auto tex=fbo->getColorTexture();tex->bind();vector<unsigned char> pixels(480*scale*620*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());ofstream raw(fs::path(argv[1])/((front?"front-":"behind-")+sk+".rgba"),ios::binary);raw.write((char*)pixels.data(),pixels.size());
  }
 }
 ofstream m(fs::path(argv[1])/"metrics.json");m<<metrics.dump(2)<<'\n';ofstream o(fs::path(argv[1])/"oracle.json");o<<oracle.dump()<<'\n';ofstream l(fs::path(argv[1])/"labels.json");l<<nlohmann::json(labels).dump(2)<<'\n';
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
