#include "GelSim.h"
#include "Sample.h"
#include "degrade-filter.inc"
#include <iostream>
using namespace std;
using namespace ci;
#include "molecular-adapter.h"
#include <fstream>
#include <iostream>
using J=nlohmann::json;
SampleRef sample(const J& j) {
  auto s=std::make_shared<Sample>();auto b=j.at("buffer");s->mBuffer.mTris=b.at("tris");s->mBuffer.mBorate=b.at("borate");s->mBuffer.mAcetate=b.at("acetate");s->mBuffer.mEDTA=b.at("edta");
  for(auto f:j.at("fragments")){Sample::Fragment v;v.mBases=f.at("bases");v.mMass=f.at("mass");v.mDegrade=f.at("degrade");v.mDye=f.at("dye");v.mAspectRatio=f.at("aspectRatio");v.mAggregate.clear();for(auto w:f.at("aggregate"))v.mAggregate.push_back(w.get<float>());v.mColor=ci::Color(f["color"][0],f["color"][1],f["color"][2]);s->mFragments.push_back(v);}return s;
}
ci::Rectf rect(const J& j){return ci::Rectf(j.at("x1"),j.at("y1"),j.at("x2"),j.at("y2"));}
J vec(ci::vec2 v){return {{"x",v.x},{"y",v.y}};}
J particles(const MolecularSim& sim){J out=J::array();for(const auto& p:sim.mParts){J multi=J::array();for(auto m:p.mMulti)multi.push_back({{"loc",vec(m.mLoc)},{"angle",m.mAngle}});out.push_back({{"fragment",p.mFragment},{"loc",vec(p.mLoc)},{"vel",vec(p.mVel)},{"radius",vec(p.mRadius)},{"angle",p.mAngle},{"angleVel",p.mAngleVel},{"color",{p.mColor.r,p.mColor.g,p.mColor.b}},{"age",p.mAge},{"fade",p.mFade},{"alive",p.mAlive},{"degradeKey",p.mDegradeKey},{"wholeness",p.mWholeness},{"multi",multi}});}return out;}
int main(int argc,char**argv){
 if(argc!=4)return 2;
 GelSim::gTuning.load(ci::JsonTree(ci::loadFile(argv[1])));MolecularSim::gTuning.load(ci::JsonTree(ci::loadFile(argv[3])));
 std::ifstream file(argv[2]);J cases;file>>cases;J output=J::array();
 for(auto c:cases){MolecularSim sim;sim.mRand.seed(c.at("seed").get<uint32_t>());sim.mRandSeed=c.at("seed").get<uint32_t>();ci::Rand::randSeed(c.at("globalSeed"));sim.setBounds(rect(c.at("bounds")));sim.setSample(sample(c.at("sample")));J frames=J::array();
  for(auto step:c.at("steps")){
   if(step.contains("sample"))sim.setSample(sample(step["sample"]));
   if(step.contains("bounds"))sim.setBounds(rect(step["bounds"]));
   if(step.contains("popDensityScale"))sim.mPopDensityScale=step["popDensityScale"];
   if(step.contains("timeScale"))sim.mTimeScale=step["timeScale"];
   for(int f:step.value("spawn",J::array()))sim.mParts.push_back(sim.randomPart(f));
   for(int i=0;i<step.value("ticks",0);i++)sim.tick(step.value("bulletTime",false));
   if(step.value("preroll",false))sim.preroll();
   frames.push_back(particles(sim));
  }
  ci::Rand rng(c.at("seed").get<uint32_t>());J uints=J::array(),floats=J::array();
  for(int i=0;i<700;i++)uints.push_back(rng.nextUint());
  rng.seed(c.at("seed").get<uint32_t>());for(int i=0;i<700;i++)floats.push_back(rng.nextFloat());
  output.push_back({{"id",c.at("id")},{"frames",frames},{"uints",uints},{"floats",floats}});
 }
 std::cout<<output.dump(2)<<std::endl;
}
