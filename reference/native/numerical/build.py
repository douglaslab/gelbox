#!/usr/bin/env python3
"""Build the pinned native model in isolation; never reads edited source files."""
import argparse, subprocess, pathlib, hashlib, json, platform
p=argparse.ArgumentParser();p.add_argument('--gelbox',default='/Users/shawn/code/gelbox');p.add_argument('--cinder',default='/Users/shawn/code/Cinder');p.add_argument('--build',default='/tmp/gel-native-numerical');p.add_argument('--capture',action='store_true');a=p.parse_args()
a.cinder=str(pathlib.Path(a.cinder).resolve());a.gelbox=str(pathlib.Path(a.gelbox).resolve());a.build=str(pathlib.Path(a.build).resolve())
expected_cinder='f90f332d1a4d453282c76435f3401271f25922f9'
assert subprocess.check_output(['git','-C',a.cinder,'rev-parse','HEAD']).decode().strip()==expected_cinder, 'Cinder revision differs from reference'
assert not subprocess.check_output(['git','-C',a.cinder,'status','--porcelain']).strip(), 'Cinder checkout must be clean'
root=pathlib.Path(__file__).resolve().parent;out=pathlib.Path(a.build);out.mkdir(parents=True,exist_ok=True)
files=['src/GelSim.cpp','include/GelSim.h','include/Sample.h','include/Buffer.h','include/Band.h','include/Dye.h','include/Aggregate.h','include/Config.h','include/GelView.h','src/GelView.cpp','assets/tuning/gel-sim.json']
hashes={}
for name in files:
 data=subprocess.check_output(['git','-C',a.gelbox,'show',f'5f51097:{name}']);dest=out/'pinned'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);hashes[name]=hashlib.sha256(data).hexdigest()
sample_bytes=subprocess.check_output(['git','-C',a.gelbox,'show','5f51097:src/Sample.cpp']);hashes['src/Sample.cpp']=hashlib.sha256(sample_bytes).hexdigest();sample=sample_bytes.decode();start=sample.index('void Sample::clearDyes()');end=sample.index('\n}',start)+2
(out/'sample-constructor.cpp').write_text('#include "Sample.h"\n'+sample[start:end]+'\n')
view=(out/'pinned/src/GelView.cpp').read_text();start=view.index('int GelView::solveBasePairForY(');end=view.index('\n}',start)+2
(out/'solver.inc').write_text(view[start:end]+'\n')
# Force the same fundamental types as native's prefix header plus Cinder's retained legacy JSON API.
(out/'prefix.h').write_text('#include "cinder/Cinder.h"\n#include "cinder/gl/gl.h"\n#include "cinder/JsonTree.h"\n')
cmake=f'''cmake_minimum_required(VERSION 3.16)
project(GelNumerical LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{a.cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(gel-numerical "{root}/driver.cpp" "{out}/pinned/src/GelSim.cpp" "{out}/sample-constructor.cpp" "{a.cinder}/src/cinder/JsonTree.cpp" "{a.cinder}/src/jsoncpp/jsoncpp.cpp")
target_include_directories(gel-numerical PRIVATE "{out}/pinned/include" "{out}")
target_compile_options(gel-numerical PRIVATE -include "{out}/prefix.h")
target_link_libraries(gel-numerical PRIVATE cinder)
'''
(out/'CMakeLists.txt').write_text(cmake)
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
manifest={'gelboxCommit':'5f51097','sourceHashes':hashes,'cinderCommit':subprocess.check_output(['git','-C',a.cinder,'rev-parse','HEAD']).decode().strip(),'compiler':subprocess.check_output(['clang++','--version']).decode(),'cinderLibrarySha256':hashlib.sha256((pathlib.Path(a.cinder)/'lib/macosx/Release/libcinder.a').read_bytes()).hexdigest(),'limitations':['Cinder revision differs from original 0.9.0; not shipped-binary numerical certification.','Sample::clearDyes extracted verbatim to satisfy constructor; other Sample methods are not linked.','No native GUI or rendering included.','Library/source correspondence is recorded by hashes, not independently verified.']}
manifest.update(host=platform.platform(), architecture=platform.machine(),
  executableSha256=hashlib.sha256((out/'build/gel-numerical').read_bytes()).hexdigest(),
  compileFlags=(out/'build/CMakeFiles/gel-numerical.dir/flags.make').read_text(),
  harnessHashes={name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in ['build.py','driver.cpp','generate-cases.py','solver-adapter.h']})
if a.capture:
  command=[str(out/'build/gel-numerical'),str(out/'pinned/assets/tuning/gel-sim.json'),str(root/'cases.json')]
  result=subprocess.check_output(command)
  assert result==subprocess.check_output(command), 'Native reference output is not deterministic'
  manifest.update(casesSha256=hashlib.sha256((root/'cases.json').read_bytes()).hexdigest(),outputsSha256=hashlib.sha256(result).hexdigest(),caseCount=len(json.loads(result)))
  (root/'outputs.json').write_bytes(result)
  (root/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(out/'build/gel-numerical')
