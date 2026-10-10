#include "Sample.h"
#include <iostream>
#include <iomanip>
int main(int argc,char** argv) {
  if(argc!=2 && argc!=3){std::cerr<<"usage: gel-file-interop native-sample.json\n";return 2;}
  try {
    ci::JsonTree root(ci::loadFile(argv[1]));
    Sample sample(root.getChild("Sample"));
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
