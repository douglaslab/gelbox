#pragma once
#include "GelSim.h"
#include "Sample.h"
#include "Config.h"
#include <map>
using namespace std;
using namespace ci;
#include "degrade-filter.inc"
Config gConfig;
const Config& kConfig = gConfig;
// Only the GUI-owned well lookup is supplied by the harness. The solver body
// and Config defaults below come from pinned Git objects, unchanged.
struct OracleGel {
  ci::Rectf well;
  SampleRef sample;
  GelSim::Context context;
  std::vector<Band> bands;
  const std::vector<Band>& getBands() const { return bands; }
  GelSim::Context getSimContext(const Sample& source) const {
    auto ctx=context;ctx.mSampleBuffer=source.mBuffer;return ctx;
  }
  ci::Rectf getWellBounds(int) const { return well; }
};
class GelView {
public:
  typedef std::map<int,int> tReverseGelSolverCache;
  explicit GelView(ci::Rectf well) : mGel(std::make_shared<OracleGel>(OracleGel{well})) {}
  SampleRef getSample(int) const { return mGel->sample; }
  std::vector<Band> pickBands(ci::vec2 pos) const;
  SampleRef makeSampleFromGelPos(ci::vec2 pos, DegradeFilter&) const;
  float getDragBandYReference(const Band& b) const { return b.mRect.y1; }
  int solveBasePairForY(int findy, Sample sample, int fragi, int lane, int aggregate,
    GelSim::Context context, tReverseGelSolverCache* cache = nullptr) const;
  std::shared_ptr<OracleGel> mGel;
};
#include "solver.inc"

#include "pick-bands.inc"
#include "loupe.inc"
