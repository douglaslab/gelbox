#!/usr/bin/env python3
from pathlib import Path
import argparse, hashlib, json, os, subprocess
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=Path('/tmp/gel-loupe-geometry'));p.add_argument('--update',action='store_true');a=p.parse_args()
cinder=Path(os.environ.get('CINDER_REFERENCE_REPO','/Users/shawn/code/Cinder'))
legacy='75f4821216a0e105075f3c55be1fbe38784a18c6';modern='f90f332d1a4d453282c76435f3401271f25922f9'
assert subprocess.check_output(['git','-C',str(cinder),'rev-parse','HEAD'],text=True).strip()==modern
assert not subprocess.check_output(['git','-C',str(cinder),'status','--porcelain'])
def source(name):return subprocess.check_output(['git','-C',str(cinder),'show',legacy+':'+name]).decode()
header=source('include/cinder/GeomIo.h');cpp=source('src/cinder/GeomIo.cpp');draw=source('src/cinder/gl/draw.cpp')
parts=[]
for name in ['Ring']:
 start=header.index('class '+name+' :');end=header.index('\n};',start)+3;parts.append(header[start:end])
for name in ['Ring']:
 start=cpp.index(name+'::'+name+'()');end=cpp.index('///////////////////////////////////////////////////////////////////////////////////////',start);parts.append(cpp[start:end])
extracted='\n'.join(parts);a.output.mkdir(exist_ok=True,parents=True);(a.output/'legacy-ring.inc').write_text(extracted)
(a.output/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(LoupeGeometry LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(loupe-geometry "{root}/geometry.cpp")
target_include_directories(loupe-geometry PRIVATE "{a.output}")
target_link_libraries(loupe-geometry PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(a.output),'-B',str(a.output/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(a.output/'build'),'-j','4'],check=True)
exe=a.output/'build/loupe-geometry';raw=subprocess.check_output([str(exe)]);assert raw==subprocess.check_output([str(exe)])
if a.update:(root/'geometry.json').write_bytes(raw)
else:assert raw==(root/'geometry.json').read_bytes()
sha=lambda data:hashlib.sha256(data).hexdigest()
report=dict(legacyCinderCommit=legacy,hostCinderCommit=modern,extractedSha256=sha(extracted.encode()),sources={n:sha(source(n).encode()) for n in ['include/cinder/GeomIo.h','src/cinder/GeomIo.cpp','src/cinder/gl/draw.cpp']},driverSha256=sha((root/'geometry.cpp').read_bytes()),executableSha256=sha(exe.read_bytes()),geometrySha256=sha(raw),repeatIdentical=True,limits=['Legacy class declarations and method bodies extracted verbatim into separate namespace; modern Cinder target/types/link support.','Legacy Ring TRIANGLE_STRIP geometry, radius16*.65, native explicit segment count.'])
(a.output/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'geometry-provenance.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'verified':{k:len(v)//2 for k,v in json.loads(raw).items()}}))
