#include "GelSim.h"
#include "Sample.h"
#include "degrade-filter.inc"
#include <fstream>
#include <iostream>
using namespace std;
using namespace ci;
#include "molecular-adapter.h"
using J=nlohmann::json;
int main(int argc,char** argv) {
 if(argc!=4)return 2;
 GelSim::gTuning.load(ci::JsonTree(ci::loadFile(argv[1])));
 MolecularSim::gTuning.load(ci::JsonTree(ci::loadFile(argv[3])));
 std::ifstream file(argv[2]);J cases;file>>cases;J output=J::array();
 for(auto c:cases) {
  auto j=c.at("part");MolecularSim::Part p;
  p.mLoc=vec2(j["loc"]["x"],j["loc"]["y"]);p.mRadius=vec2(j["radius"]["x"],j["radius"]["y"]);
  p.mAngle=j["angle"];p.mWholeness=j["wholeness"];p.mDegradeKey=j["degradeKey"];p.mFade=j["fade"];
  p.mColor=Color(j["color"][0],j["color"][1],j["color"][2]);
  for(auto m:j["multi"]){MolecularSim::Part::Multi slot;slot.mLoc=vec2(m["loc"]["x"],m["loc"]["y"]);slot.mAngle=m["angle"];p.mMulti.push_back(slot);}
  auto mesh=TriMesh::create(TriMesh::Format().positions(2).colors(4));
  if(c["selected"].get<bool>() || c["rollover"].get<bool>()) {
   Color selection(0,0,0),hover(1,1,0);
   Color col=c["selected"].get<bool>()?(c["rollover"].get<bool>()?lerp(selection,hover,.5f):selection):hover;
   mesh=concatMesh(mesh,p.makeMesh(ColorA(col,p.mFade),4),p.getRootTransform());
  }
  mesh=concatMesh(mesh,p.makeMesh(),p.getRootTransform());
  J data=J::array();auto positions=mesh->getPositions<2>();auto colors=mesh->getColors<4>();
  for(auto i:mesh->getIndices()){data.push_back(positions[i].x);data.push_back(positions[i].y);data.push_back(colors[i].r);data.push_back(colors[i].g);data.push_back(colors[i].b);data.push_back(colors[i].a);}
  output.push_back({{"id",c["id"]},{"data",data}});
 }
 cout<<output.dump(2)<<endl;
}
