// Original Band and drawBands; adapters only supply bands and capture gl::draw.
#include "cinder/Rect.h"
#include "cinder/Color.h"
#include "cinder/TriMesh.h"
#include "cinder/Json.h"
#include "Band.h"
#include <fstream>
#include <iostream>
using namespace ci;
using namespace std;
using J=nlohmann::json;
constexpr int GL_SRC_ALPHA=0x0302, GL_ONE=1;
TriMesh captured;
namespace cinder::gl {
struct ScopedBlend {
 ScopedBlend(int source,int destination) {
  if(source!=GL_SRC_ALPHA || destination!=GL_ONE)throw runtime_error("unexpected blend");
 }
};
void draw(const TriMesh& mesh) { captured=mesh; }
}
struct GelAdapter { vector<Band> bands; const vector<Band>& getBands() const { return bands; } };
struct GelView { shared_ptr<GelAdapter> mGel; void drawBands() const; };
#include "direct-bands-method.inc"
int main(int argc,char** argv) {
 if(argc!=2)return 2;
 ifstream input(argv[1]);J cases;input>>cases;J output=J::array();
 for(const auto& c:cases) {
  GelView view;view.mGel=make_shared<GelAdapter>();
  for(const auto& j:c["bands"]) {
   Band b;auto r=j["rect"];b.mRect=Rectf(r["x1"],r["y1"],r["x2"],r["y2"]);
   b.mBlur=j["blur"];b.mBrightness=j["brightness"];b.mColor=Color(j["color"][0],j["color"][1],j["color"][2]);
   b.mSmearAbove=j["smearAbove"];b.mSmearBelow=j["smearBelow"];b.mFlameHeight=j["flameHeight"];
   for(int i=0;i<2;++i){b.mSmearBrightnessAbove[i]=j["smearBrightnessAbove"][i];b.mSmearBrightnessBelow[i]=j["smearBrightnessBelow"][i];}
   view.mGel->bands.push_back(b);
  }
  view.drawBands();J data=J::array();
  auto positions=captured.getPositions<2>();auto colors=captured.getColors<4>();
  for(auto i:captured.getIndices())for(float value:{positions[i].x,positions[i].y,colors[i].r,colors[i].g,colors[i].b,colors[i].a})data.push_back(value);
  output.push_back({{"id",c["id"]},{"data",data}});
 }
 cout<<output.dump(2)<<endl;
}
