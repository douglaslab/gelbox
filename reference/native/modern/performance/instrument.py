#!/usr/bin/env python3
"""Add an observation-only workload probe to a fresh compatibility reference."""
from pathlib import Path
import argparse, hashlib, json
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);a=p.parse_args()
r=Path(__file__).resolve().parent;m=json.loads((r.parent/'manifest.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
changes={}
for name in ['src/GelboxApp.cpp','include/SampleView.h','include/MolecularSim.h','proj/cmake/CMakeLists.txt']:
 f=a.source/name;b=f.read_bytes();assert sha(b)==m['sourceHashes'][name],name
 s=b.decode()
 if name=='src/GelboxApp.cpp':
  s='#include <chrono>\n#include <fstream>\n#include <cstdlib>\n#include "cinder/ImageIo.h"\nstatic int gPerfTicks=0;\nstatic double gPerfUpdateMs=0;\nusing PerfClock=std::chrono::steady_clock;\n'+s
  n='void GelboxApp::update()\n{';assert s.count(n)==1
  s=s.replace(n,n+'\n ++gPerfTicks; auto perfStart=PerfClock::now();')
  n='\n}\n\nvoid GelboxApp::draw()';assert s.count(n)==1
  s=s.replace(n,'\n gPerfUpdateMs=std::chrono::duration<double,std::milli>(PerfClock::now()-perfStart).count();'+n)
  n='void GelboxApp::draw()\n{';assert s.count(n)==1
  s=s.replace(n,n+'\n auto perfDrawStart=PerfClock::now();')
  n='\tif ( Interaction::get() ) Interaction::get()->draw();';assert s.count(n)==1
  s=s.replace(n,n+'\n'+(r/'probe.inc').read_text())
 elif name=='include/SampleView.h':
  n='\nprivate:';assert s.count(n)==1;s=s.replace(n,'\n MolecularSim& referenceMolecularSim() { return mMolecularSim; }\n'+n)
 elif name=='include/MolecularSim.h':
  s=s.replace('\nprivate:','\nprivate:\n friend class GelboxApp;\n',1)
 else:s=s.replace('org.douglaslab.Gelbox','org.douglaslab.GelboxPerformanceReference')
 f.write_text(s);changes[name]={'before':sha(b),'after':sha(f.read_bytes())}
(a.source.parent/'performance-inputs.json').write_text(json.dumps({'changes':changes,'probeSha256':sha((r/'probe.inc').read_bytes()),'instrumentSha256':sha(Path(__file__).read_bytes())},indent=2)+'\n')
