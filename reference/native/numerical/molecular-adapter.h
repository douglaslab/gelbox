#pragma once
#include "molecular-tuning.inc"
// Only storage and declarations are supplied here. Fragment fields, tuning and
// all setup formulas are extracted verbatim from the pinned native sources.
class MolecularSim {
public:
#include "molecular-frag.inc"
  static MolecularSimTuning gTuning;
  static const MolecularSimTuning& kTuning;
  float calcTargetPop(float mass) const;
  void setSample(SampleRef sample, DegradeFilter* degradeFilter = nullptr);
  SampleRef mSample;
  DegradeFilter mDegradeFilter;
  std::vector<Frag> mFragments;
};
MolecularSimTuning MolecularSim::gTuning;
const MolecularSimTuning& MolecularSim::kTuning = MolecularSim::gTuning;
const bool kVerbosePopCount = false;
#include "molecular-functions.inc"
