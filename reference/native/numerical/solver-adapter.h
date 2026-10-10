#pragma once
#include "GelSim.h"
#include "Sample.h"
#include "Config.h"
#include <map>
using namespace std;
using namespace ci;
Config gConfig;
const Config& kConfig = gConfig;
// Only the GUI-owned well lookup is supplied by the harness. The solver body
// and Config defaults below come from pinned Git objects, unchanged.
struct OracleGel {
  ci::Rectf well;
  ci::Rectf getWellBounds(int) const { return well; }
};
class GelView {
public:
  typedef std::map<int,int> tReverseGelSolverCache;
  explicit GelView(ci::Rectf well) : mGel(std::make_shared<OracleGel>(OracleGel{well})) {}
  float getDragBandYReference(const Band& b) const { return b.mRect.y1; }
  int solveBasePairForY(int findy, Sample sample, int fragi, int lane, int aggregate,
    GelSim::Context context, tReverseGelSolverCache* cache = nullptr) const;
  std::shared_ptr<OracleGel> mGel;
};
#include "solver.inc"
