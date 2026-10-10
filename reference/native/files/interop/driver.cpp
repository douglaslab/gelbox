#include "Sample.h"
#include <iostream>
#include <iomanip>
int main(int argc,char** argv) {
  if(argc!=2 && argc!=3){std::cerr<<"usage: gel-file-interop native-sample.json|sample.xml [--mass-values]\n";return 2;}
  try {
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
