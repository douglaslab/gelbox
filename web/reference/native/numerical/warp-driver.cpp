#include "cinder/gl/gl.h"
#include "cinder/Surface.h"
#include "cinder/Rand.h"
#include "cinder/Json.h"
#include <fstream>
#include <iostream>
using namespace ci;
using namespace std;
using J=nlohmann::json;
// Texture uploads and the GPU pass are capture boundaries. CPU methods below
// remain verbatim; Cinder Surface and Rand are the real library implementations.
class GelRender {
public:
 ivec2 mGelSize, mOutputSize;
 struct Tuning { struct Overcook { vec2 mScale; } mOvercook; } kTuning;
 mutable Surface8uRef captured;
 mutable vec2 scale;
 Surface8uRef get1dTex(Surface8uRef s) const { return s; }
 Surface8uRef get2dTex(Surface8uRef s) const { return s; }
 void warp(gl::FboRef&,gl::FboRef&,Surface8uRef s,vec2 value) const { captured=s; scale=value/vec2(mGelSize); }
 void smileBand(gl::FboRef&,gl::FboRef&,float,float,float,float) const;
 void wellDamageBand(gl::FboRef&,gl::FboRef&,Rectf,float,int) const;
 void overcook(gl::FboRef&,gl::FboRef&,float,int);
};
#include "warp-functions.inc"
int main(int argc,char** argv) {
 if(argc!=3)return 2;
 ifstream input(argv[1]), tuningInput(argv[2]);J cases,tuning;input>>cases;tuningInput>>tuning;
 J output=J::array();
 for(auto c:cases) {
  GelRender r;r.mGelSize=ivec2(c["width"],c["height"]);
  r.mOutputSize=ivec2(vec2(r.mGelSize)*c["ppu"].get<float>());
  r.kTuning.mOvercook.mScale=vec2(stof(tuning["Overcook"]["Scale"]["x"].get<string>()),stof(tuning["Overcook"]["Scale"]["y"].get<string>()));
  gl::FboRef a,b;auto rect=c["rect"];Rectf bounds(rect[0],rect[1],rect[2],rect[3]);
  if(c["kind"]=="smile")r.smileBand(a,b,bounds.x1,bounds.x2,c["amount"],c["exp"]);
  else if(c["kind"]=="damage")r.wellDamageBand(a,b,bounds,c["amount"],c["seed"]);
  else r.overcook(a,b,c["amount"],c["seed"]);
  J value=nullptr;
  if(r.captured) {
   J data=J::array();auto iter=r.captured->getIter();
   while(iter.line())while(iter.pixel()){data.push_back(iter.r());data.push_back(iter.g());data.push_back(iter.b());data.push_back(255);}
   value={{"width",r.captured->getWidth()},{"height",r.captured->getHeight()},{"scale",{r.scale.x,r.scale.y}},{"data",data}};
  }
  output.push_back({{"id",c["id"]},{"warp",value}});
 }
 cout<<output.dump()<<endl;
}
