#define GL_SILENCE_DEPRECATION
#include "cinder/gl/gl.h"
#include "cinder/gl/Environment.h"
#include "cinder/Json.h"
#include <OpenGL/OpenGL.h>
#include <fstream>
#include <iostream>
using namespace ci;using namespace std;
#include "layout.inc"
Layout gLayout;const Layout& kLayout=gLayout;
const float kSelectedColorStrokeWidth=4;const Color kSelectedColorStrokeColor(0,0,0);
struct FragmentView {static vector<Color> sColorPalette;static const vector<Color>& getColorPalette();};
vector<Color> FragmentView::sColorPalette;
#include "colors.inc"
struct ColorPaletteView {
 vector<Color> mColors;int mColorCols=4,mSelectedColor=0;float mColorInset=2,mCornerRadius=4;
 Rectf mColorsRect;vec2 mColorSize;
 void setFrame(Rectf){}void setBounds(Rectf){}Rectf getBounds()const{return mColorsRect;}
 void layout(Rectf);void draw();Rectf calcColorRect(int)const;
};
#include "palette-methods.inc"
int main(int argc,char** argv){
 if(argc!=3)throw runtime_error("reference and output directories required");
 CGLPixelFormatAttribute attrs[]={kCGLPFAAccelerated,kCGLPFAOpenGLProfile,(CGLPixelFormatAttribute)kCGLOGLPVersion_3_2_Core,(CGLPixelFormatAttribute)0};
 CGLPixelFormatObj pf=nullptr;GLint count=0;if(CGLChoosePixelFormat(attrs,&pf,&count)||!pf)throw runtime_error("pixel format");
 CGLContextObj cgl=nullptr;if(CGLCreateContext(pf,nullptr,&cgl))throw runtime_error("context");CGLDestroyPixelFormat(pf);CGLSetCurrentContext(cgl);
 gl::Environment::setCore();auto context=gl::Context::createFromExisting(make_shared<gl::PlatformDataMac>(cgl));context->makeCurrent();
 ifstream input(fs::path(argv[1])/"cases.json");nlohmann::json cases;input>>cases;
 ColorPaletteView palette;palette.mColors=FragmentView::getColorPalette();palette.layout(Rectf(kLayout.mFragViewColorsTopLeft,kLayout.mFragViewColorsTopLeft+kLayout.mFragViewColorSize*vec2(4,3)));
 for(int scale:{1,2}){
  auto fbo=gl::Fbo::create(400*scale,240*scale,gl::Fbo::Format().disableDepth().samples(4).colorTexture(gl::Texture2d::Format().internalFormat(GL_RGBA8)));
  for(const auto& c:cases)for(bool front:{false,true}){
   {gl::ScopedFramebuffer target(fbo);gl::viewport(0,0,400*scale,240*scale);gl::setMatricesWindow(400,240,false);gl::clear(ColorA(.1,.2,.35,1));gl::enableAlphaBlending();
    auto triangle=[](){gl::color(ColorA(.8,.3,.1,.65));gl::drawSolidTriangle(vec2(100,15),vec2(380,220),vec2(15,210));};if(!front)triangle();
    {gl::ScopedModelMatrix transform;gl::translate(vec2(40.25f,30.75f));palette.mSelectedColor=c["selected"];palette.draw();}if(front)triangle();
   }
   auto tex=fbo->getColorTexture();gl::ScopedTextureBind readback(tex);vector<unsigned char> pixels(400*scale*240*scale*4);glGetTexImage(GL_TEXTURE_2D,0,GL_RGBA,GL_UNSIGNED_BYTE,pixels.data());
   ofstream raw(fs::path(argv[2])/(c["id"].get<string>()+(front?"-front-":"-behind-")+to_string(scale)+".rgba"),ios::binary);raw.write((char*)pixels.data(),pixels.size());
  }
 }
 cout<<glGetString(GL_VENDOR)<<" / "<<glGetString(GL_RENDERER)<<" / "<<glGetString(GL_VERSION)<<"\n";
}
