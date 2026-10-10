#include "Sample.h"
#include "Gel.h"
#include <sstream>
#include <iostream>
#include <iomanip>
using J=nlohmann::json;
J bufferState(const Gelbox::Buffer& b) {
  return {{"Tris",b.mTris},{"Borate",b.mBorate},{"Acetate",b.mAcetate},{"EDTA",b.mEDTA}};
}
J sampleState(const Sample& s) {
  J fragments=J::array();
  for(const auto& f:s.mFragments) {
    J item={{"Bases",f.mBases},{"Mass",f.mMass},{"Degrade",f.mDegrade},
      {"AspectRatio",f.mAspectRatio},{"Color",{f.mColor.r,f.mColor.g,f.mColor.b}},
      {"Aggregate",f.mAggregate.get()}};
    if(f.mDye>=0)item["Dye"]=Dye::kNames[f.mDye];
    fragments.push_back(item);
  }
  return {{"name",s.mName},{"icon",s.mIconFileName},{"iconScale",s.mIconScale},
    {"id",s.mID},{"Buffer",bufferState(s.mBuffer)},{"Fragments",fragments}};
}
int main(int argc,char** argv) {
  if(argc!=2 && argc!=3){std::cerr<<"usage: gel-file-interop native-sample.json|sample.xml [--mass-values]\n";return 2;}
  try {
    if(!std::string(argv[1]).ends_with(".xml")) {
      ci::JsonTree document(ci::loadFile(argv[1]));
      if(document.hasChild("Gel")) {
        if(!document.getChild("Gel").hasChild("Samples"))throw std::runtime_error("Gel harness requires explicit Samples; absent native layout/storage is indeterminate");
        const auto tuning=ci::fs::path(argv[0]).parent_path().parent_path()/"assets/tuning/gel-sim.json";
        GelSim::gTuning.load(ci::JsonTree(ci::loadFile(tuning)));
        struct CaptureLog {
          std::ostringstream text;
          std::streambuf* previous=std::cout.rdbuf(text.rdbuf());
          ~CaptureLog(){std::cout.rdbuf(previous);std::cerr<<text.str();}
        };
        Gel gel=[&](){CaptureLog log;return Gel(document.getChild("Gel"));}();
        if(argc==3 && std::string(argv[2])=="--gel-state") {
          J samples=J::array();for(const auto& sample:gel.getSamples())samples.push_back(sample?sampleState(*sample):J(nullptr));
          J state={{"visibleLanes",gel.getNumLanes()},{"samples",samples},{"buffer",bufferState(gel.getBuffer())},
            {"time",gel.getTime()},{"voltage",gel.getVoltage()},{"wellDamage",gel.getWellDamage()}};
          std::cout<<state.dump(2)<<std::endl;return 0;
        }
        ci::JsonTree result=ci::JsonTree::makeObject();result.addChild(gel.toJson());
        std::cout<<result<<std::endl;return 0;
      }
    }
    Sample sample = [&]() {
      if(std::string(argv[1]).ends_with(".xml"))
        return Sample(ci::XmlTree(ci::loadFile(argv[1])));
      ci::JsonTree root(ci::loadFile(argv[1]));
      return Sample(root.getChild("Sample"));
    }();
    if(argc==3 && std::string(argv[2])=="--mass-values") {
      std::cout<<"["<<std::setprecision(17);
      for(size_t i=0;i<sample.mFragments.size();++i){if(i)std::cout<<",";std::cout<<sample.mFragments[i].mMass;}
      std::cout<<"]"<<std::endl;return 0;
    }
    ci::JsonTree result=ci::JsonTree::makeObject();
    result.addChild(sample.toJson());
    std::cout<<result<<std::endl;
    return 0;
  }catch(const std::exception& error){std::cerr<<error.what()<<std::endl;return 1;}
}
