#include "GelSim.h"
#include "Sample.h"
#include "solver-adapter.h"
#include "molecular-adapter.h"
#include <fstream>
#include <iostream>
using J = nlohmann::json;
J rect(const ci::Rectf& r) { return {{"x1",r.x1},{"y1",r.y1},{"x2",r.x2},{"y2",r.y2}}; }
Gelbox::Buffer buffer(const J& j) {
  Gelbox::Buffer b;b.mTris=j.at("tris");b.mBorate=j.at("borate");b.mAcetate=j.at("acetate");b.mEDTA=j.at("edta");return b;
}
J molecular(SampleRef sample, DegradeFilter* filter=nullptr) {
  MolecularSim sim;sim.setSample(sample,filter);J result=J::array();
  for(const auto& f:sim.mFragments)result.push_back({{"targetPop",f.mTargetPop},{"isDye",f.mIsDye},{"radius",{{"x",f.mRadius.x},{"y",f.mRadius.y}}},{"wholenessLo",f.mWholenessLo},{"wholenessHi",f.mWholenessHi},{"aggregateWeightSum",f.mAggregateWeightSum}});
  return result;
}
int main(int argc,char** argv) {
  if(argc!=4) { std::cerr<<"usage: gel-numerical tuning.json cases.json molecular-tuning.json\n";return 2; }
  GelSim::gTuning.load(ci::JsonTree(ci::loadFile(argv[1])));
  MolecularSim::gTuning.load(ci::JsonTree(ci::loadFile(argv[3])));
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
    J solved=J::array();GelView view(well);
    for(const auto& request:c.value("solverTargets",J::array())) {
      solved.push_back({{"targetY",request.at("targetY")},{"aggregate",request.at("aggregate")},
        {"bases",view.solveBasePairForY(request.at("targetY").get<float>(),sample,fragment,lane,request.at("aggregate"),ctx)}});
    }
    J probes=J::array();
    if(c.value("loupeProbes",false)) {
      view.mGel->sample=std::make_shared<Sample>(sample);view.mGel->context=ctx;
      view.mGel->bands=GelSim::fragToBands(sample,fragment,well,lane,ctx);
      std::vector<ci::vec2> points{ci::vec2(-10000,-10000)};
      for(const auto& b:view.mGel->bands) {
        points.push_back(b.mRect.getCenter());
        points.push_back(ci::vec2(b.mRect.getCenter().x,b.mRect.y1));
        points.push_back(ci::vec2(b.mRect.getCenter().x,b.mRect.y2));
        points.push_back(ci::vec2(b.mRect.getCenter().x,b.mRect.y1-b.mSmearAbove*.25f));
        points.push_back(ci::vec2(b.mRect.getCenter().x,b.mRect.y2+b.mSmearBelow*.25f));
        points.push_back(ci::vec2(b.mRect.x1-b.mBlur*.5f,b.mRect.y1-b.mSmearAbove*.25f));
      }
      for(const auto& point:points) {
        DegradeFilter filter;auto derived=view.makeSampleFromGelPos(point,filter);J fragments=J::array(),values=J::array();
        for(const auto& f:derived->mFragments) fragments.push_back({{"bases",f.mBases},{"mass",f.mMass},{"degrade",f.mDegrade},{"dye",f.mDye},{"aspectRatio",f.mAspectRatio},{"aggregate",f.mAggregate.get()},{"color",{f.mColor.r,f.mColor.g,f.mColor.b}},{"originFragment",f.mOriginSampleFrag}});
        for(const auto& pair:filter)values.push_back({pair.first,pair.second});
        auto b=derived->mBuffer;
        probes.push_back({{"point",{{"x",point.x},{"y",point.y}}},{"fragments",fragments},{"filter",values},{"molecular",molecular(derived,&filter)},{"buffer",{{"tris",b.mTris},{"borate",b.mBorate},{"acetate",b.mAcetate},{"edta",b.mEDTA}}}});
      }
    }
    J filtered=J::array();
    if(c.value("loupeProbes",false) || c.at("id").get<string>().find("aggregate-")==0) {
      for(int bp:{0,1,1001,14000,20000}) {
        DegradeFilter f;f[fragment]=bp;
        filtered.push_back({{"index",fragment},{"bases",bp},{"fragments",molecular(std::make_shared<Sample>(sample),&f)}});
      }
    }
    outputs.push_back({{"molecular",molecular(std::make_shared<Sample>(sample))},{"molecularFiltered",filtered},{"id",c.at("id")},{"bands",bands},{"nativeMetadata",metadata},{"solved",solved},{"loupeProbes",probes}});
  }
  std::cout<<outputs.dump(2)<<std::endl;
}
