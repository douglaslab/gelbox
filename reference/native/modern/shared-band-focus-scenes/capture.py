#!/usr/bin/env python3
"""Capture pinned band-focus drawing with explicit band/sample adapters."""
from pathlib import Path
import argparse,subprocess,json,hashlib,tempfile
from PIL import Image
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);a=p.parse_args()
out=a.output or Path(tempfile.mkdtemp(prefix='gel-native-band-focus-'));out.mkdir(exist_ok=True,parents=True)
cinder=Path('/Users/shawn/code/Cinder');repo=Path('/Users/shawn/code/gelbox');pin='5f5109705279085fcf6bcac6c8be1c9806b6d3d6';host='f90f332d1a4d453282c76435f3401271f25922f9'
assert subprocess.check_output(['git','-C',str(cinder),'rev-parse','HEAD'],text=True).strip()==host
assert not subprocess.check_output(['git','-C',str(cinder),'status','--porcelain'])
sha=lambda data:hashlib.sha256(data).hexdigest()
read=lambda path:subprocess.check_output(['git','-C',str(repo),'show',pin+':'+path],text=True)
def method(source,signature):
 start=source.index(signature);brace=source.index('{',start);depth=1;end=brace+1
 while depth:
  if source[end]=='{':depth+=1
  elif source[end]=='}':depth-=1
  end+=1
 return source[start:end]
sources={name:read(name) for name in ['src/GelView.cpp','src/GelSim.cpp','include/Sample.h','include/View.h','src/View.cpp']}
methods=method(sources['src/GelView.cpp'],'void GelView::drawBandFocus() const')
(out/'focus-method.inc').write_text(methods)
assert 'if (s) a += .65f;' in methods and 'if (r) a += .35f;' in methods
assert 'mSample == rhs.mSample && mFrag == rhs.mFrag' in sources['include/Sample.h']
assets=[]
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(BandFocusScenes LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(band-focus-scenes "{root}/driver.cpp")
target_include_directories(band-focus-scenes PRIVATE "{out}")
target_link_libraries(band-focus-scenes PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True)
 renderers.append(subprocess.check_output([str(out/'build/band-focus-scenes'),str(root),str(dest)],text=True).strip())
assert renderers[0]==renderers[1]
entries=[]
for c in json.loads((root/'cases.json').read_text()):
 for scale in [1,2]:
  for order in ['front','behind']:
   name=c['id']+'-'+order+'-'+str(scale);data=(out/'one'/(name+'.rgba')).read_bytes();assert data==(out/'two'/(name+'.rgba')).read_bytes()
   image=Image.frombytes('RGBA',(400*scale,240*scale),data).convert('RGB');target=root/(name+'.png')
   if a.update:image.save(target)
   else:assert image.tobytes()==Image.open(target).convert('RGB').tobytes(),name
   entries.append(dict(file=target.name,sha256=sha(target.read_bytes())))
report=dict(gelboxCommit=pin,cinderCommit=host,sourceHashes={k:sha(v.encode()) for k,v in sources.items()},methodSha256=sha(methods.encode()),inputs={f:sha((root/f).read_bytes()) for f in ['driver.cpp','capture.py','cases.json']+assets},renderer=renderers[0],repeatIdentical=True,files=entries,limits=['Actual pinned GelView drawBandFocus; fixture bands and SampleFragRef identity adapter.','Explicit native View scissor arithmetic; fixture focus colors and UI rectangles, scientific generation checked separately.','Modern Cinder/macOS RGBA8 MSAA4; both scales and overlap orders, not original-release full GUI certification.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(verified=len(entries),renderer=renderers[0])))
