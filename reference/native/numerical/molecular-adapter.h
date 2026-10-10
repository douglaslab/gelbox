#pragma once
#include "cinder/Rand.h"
#include "cinder/TriMesh.h"
#include "molecular-tuning.inc"
// Only storage and declarations are supplied here. Fragment fields, tuning and
// all setup formulas are extracted verbatim from the pinned native sources.
class MolecularSim {
public:
#include "molecular-frag.inc"
#include "molecular-part.inc"
  static MolecularSimTuning gTuning;
  static const MolecularSimTuning& kTuning;
  float calcTargetPop(float mass) const;
  void setSample(SampleRef sample, DegradeFilter* degradeFilter = nullptr);
  Part randomPart(int fragment);
  int pickPart(ci::vec2 loc) const;
  int pickFragment(ci::vec2 loc) const;
  int getRandomWeightedAggregateSize(int fragment);
  void tick(bool bulletTime);
  void preroll();
  void setBounds(ci::Rectf r);
  const ci::Rectf& getBounds() const { return mBounds; }
  bool isFragment(int i) const { return i>=0 && i<mFragments.size(); }
  ci::Rectf mBounds;
  ci::Rand mRand;
  int mRandSeed=0;
  float mSizeDensityScale=1, mPopDensityScale=1, mTimeScale=1;
  std::vector<Part> mParts;
  SampleRef mSample;
  DegradeFilter mDegradeFilter;
  std::vector<Frag> mFragments;
};
MolecularSimTuning MolecularSim::gTuning;
const MolecularSimTuning& MolecularSim::kTuning = MolecularSim::gTuning;
const bool kVerbosePopCount = false;
#include "molecular-functions.inc"
