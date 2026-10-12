#include "cinder/Color.h"
#include "cinder/Rect.h"
#include "cinder/Json.h"
#include <vector>
#include <fstream>
#include <iostream>
#include <memory>
using namespace ci;
using namespace std;
#include "Dye.h"
struct Sample {struct Fragment {int mDye;float mMass;};vector<Fragment> mFragments;vector<float> getDyes() const;};
#include "get-dyes.inc"
struct MolecularSim {shared_ptr<Sample> mSample;int getBounds(){return 0;}void drawBackground(int);};
struct LayoutAdapter {Color mMolecularSimBkgndColor=Color::hex(0xF1F1F2);} kLayout;
namespace GelSim {struct Tuning {float mSliderDyeMassMax=125.f;} kTuning;}
Color captured;
namespace cinder::gl {void color(Color c){captured=c;}void drawSolidRect(int){};}
#include "background.inc"
int main(int argc,char**argv){if(argc!=2)return 2;ifstream input(argv[1]);nlohmann::json cases;input>>cases;nlohmann::json output=nlohmann::json::array();for(auto c:cases){MolecularSim sim;sim.mSample=make_shared<Sample>();if(c.contains("fragments")){for(auto f:c["fragments"])sim.mSample->mFragments.push_back({f["dye"],f["mass"]});}else{auto d=c.at("dyes").get<vector<float>>();for(int i=0;i<4;i++)sim.mSample->mFragments.push_back({i,d[i]});}sim.drawBackground(c.at("highlight").get<int>());output.push_back({{"id",c.at("id")},{"color",{captured.r,captured.g,captured.b}},{"dyes",sim.mSample->getDyes()}});}cout<<output.dump(2)<<endl;}
