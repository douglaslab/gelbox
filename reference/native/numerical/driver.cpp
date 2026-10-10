#include "GelSim.h"
#include "Sample.h"
#include <fstream>
#include <iostream>
using J = nlohmann::json;
J rect(const ci::Rectf& r) { return {{"x1",r.x1},{"y1",r.y1},{"x2",r.x2},{"y2",r.y2}}; }
Gelbox::Buffer buffer(const J& j) {
  Gelbox::Buffer b;b.mTris=j.at("tris");b.mBorate=j.at("borate");b.mAcetate=j.at("acetate");b.mEDTA=j.at("edta");return b;
}
int main(int argc,char** argv) {
  if(argc!=3) { std::cerr<<"usage: gel-numerical tuning.json cases.json\n";return 2; }
  GelSim::gTuning.load(ci::JsonTree(ci::loadFile(argv[1])));
  std::ifstream file(argv[2]);J cases;file>>cases;J outputs=J::array();
  for(const auto& c:cases) {
    Sample sample;sample.mBuffer=buffer(c.at("sample").at("buffer"));
    for(const auto& f:c.at("sample").at("fragments")) {
      Sample::Fragment v;v.mBases=f.at("bases");v.mMass=f.at("mass");v.mDegrade=f.at("degrade");v.mDye=f.at("dye");v.mAspectRatio=f.at("aspectRatio");
      v.mAggregate.clear();for(const auto& weight:f.at("aggregate"))v.mAggregate.push_back(weight.get<float>());
      v.mColor=ci::Color(f.at("color")[0],f.at("color")[1],f.at("color")[2]);sample.mFragments.push_back(v);
    }
    const auto& x=c.at("ctx");GelSim::Context ctx;ctx.mVoltage=x.at("voltage");ctx.mTime=x.at("time");ctx.mYSpaceScale=x.at("ySpaceScale");ctx.mWellDamage=x.at("wellDamage");ctx.mGelBuffer=buffer(x.at("gelBuffer"));ctx.mSampleBuffer=buffer(x.at("sampleBuffer"));
    const auto& r=c.at("wellRect");ci::Rectf well(r.at("x1"),r.at("y1"),r.at("x2"),r.at("y2"));
    int fragment=c.at("fragment"),lane=c.at("lane");J bands=J::array(),metadata=J::array();
    for(const Band& b:GelSim::fragToBands(sample,fragment,well,lane,ctx)) {
      bands.push_back({{"rect",rect(b.mRect)},{"smearAbove",b.mSmearAbove},{"smearBelow",b.mSmearBelow},
        {"smearBrightnessAbove",{b.mSmearBrightnessAbove[0],b.mSmearBrightnessAbove[1]}},{"smearBrightnessBelow",{b.mSmearBrightnessBelow[0],b.mSmearBrightnessBelow[1]}},
        {"flameHeight",b.mFlameHeight},{"smileHeight",b.mSmileHeight},{"smileExp",b.mSmileExp},{"blur",b.mBlur},{"brightness",b.mBrightness},
        {"color",{b.mColor.r,b.mColor.g,b.mColor.b}},{"randSeed",b.mRandSeed},{"wellDamage",b.mWellDamage},{"wellDamageRandSeed",b.mWellDamageRandSeed},
        {"mass",b.mMass},{"aggregate",b.mAggregate}});
      metadata.push_back({{"lane",b.mLane},{"fragment",b.mFragment},{"dye",b.mDye},{"bases",b.mBases},
        {"degradeLo",b.mDegradeLo},{"degradeHi",b.mDegradeHi},{"aspectRatio",b.mAspectRatio},{"uiRect",rect(b.mUIRect)},{"wellRect",rect(b.mWellRect)},
        {"focusColor",{b.mFocusColor.r,b.mFocusColor.g,b.mFocusColor.b}}});
    }
    outputs.push_back({{"id",c.at("id")},{"bands",bands},{"nativeMetadata",metadata}});
  }
  std::cout<<outputs.dump(2)<<std::endl;
}
