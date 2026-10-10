#!/usr/bin/env python3
"""Capture native UIFont atlas, independent string layout and raster scenes."""
from pathlib import Path
import argparse,subprocess,json,hashlib,tempfile
from PIL import Image
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);a=p.parse_args()
out=a.output or Path(tempfile.mkdtemp(prefix='gel-native-ui-text-'));out.mkdir(exist_ok=True,parents=True)
cinder=Path('/Users/shawn/code/Cinder');repo=Path('/Users/shawn/code/gelbox');pin='5f5109705279085fcf6bcac6c8be1c9806b6d3d6';host='f90f332d1a4d453282c76435f3401271f25922f9'
assert subprocess.check_output(['git','-C',str(cinder),'rev-parse','HEAD'],text=True).strip()==host
assert not subprocess.check_output(['git','-C',str(cinder),'status','--porcelain'])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
layout=subprocess.check_output(['git','-C',str(repo),'show',pin+':include/Layout.h']);(out/'layout.inc').write_bytes(layout)
app=subprocess.check_output(['git','-C',str(repo),'show',pin+':src/GelboxApp.cpp'])
assert b'gl::TextureFont::create( Font(kLayout.mUIFont,kLayout.mUIFontSize) )' in app
assert b'gl::TextureFont::create( Font(kLayout.mUIFont,kLayout.mUIFontSize*2) )' in app
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(UIText LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(ui-text "{root}/driver.cpp")
target_include_directories(ui-text PRIVATE "{out}")
target_link_libraries(ui-text PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True)
 renderers.append(subprocess.check_output([str(out/'build/ui-text'),str(dest)],text=True).strip())
assert renderers[0]==renderers[1]
for f in (out/'one').iterdir():assert f.read_bytes()==(out/'two'/f.name).read_bytes(),f.name
for name in ['metrics.json','oracle.json','labels.json']:
 if a.update:(root/name).write_bytes((out/'one'/name).read_bytes())
 else:assert (root/name).read_bytes()==(out/'one'/name).read_bytes(),name
entries=[]
for scale,meta in json.loads((out/'one/metrics.json').read_text()).items():
 for atlas in meta['atlases']:
  name=atlas['name'];im=Image.frombytes('RGBA',(atlas['width'],atlas['height']),(out/'one'/(name+'.rgba')).read_bytes());target=root/(name+'.png')
  if a.update:im.save(target)
  else:assert im.tobytes()==Image.open(target).convert('RGBA').tobytes(),name
  entries.append(dict(file=target.name,sha256=sha(target)))
 for front in ['front','behind']:
  name=front+'-'+scale;im=Image.frombytes('RGBA',(480*int(scale),620*int(scale)),(out/'one'/(name+'.rgba')).read_bytes()).convert('RGB');target=root/(name+'.png')
  if a.update:im.save(target)
  else:assert im.tobytes()==Image.open(target).convert('RGB').tobytes(),name
  entries.append(dict(file=target.name,sha256=sha(target)))
report=dict(gelboxCommit=pin,cinderCommit=host,layoutSha256=hashlib.sha256(layout).hexdigest(),appSha256=hashlib.sha256(app).hexdigest(),cinderSources={f:sha(cinder/f) for f in ['src/cinder/gl/TextureFont.cpp','src/cinder/Text.cpp','src/cinder/cocoa/CinderCocoa.mm','include/cinder/gl/TextureFont.h']},inputs={f:sha(root/f) for f in ['driver.cpp','capture.py','metrics.json','oracle.json','labels.json']},renderer=renderers[0],repeatIdentical=True,files=entries,limits=['Actual Cinder TextureFont created exactly as GelboxApp UIFont; printable ASCII character/pair metrics captured through matching CoreText attributes.','Independent actual TextureFont::measureString/getGlyphPlacements oracle for 23 representative labels and 1000 seeded ASCII strings per scale.','Atlas canonical RGBA reconstructs sampled native RG swizzle; one linear-filtered level, straight alpha.','Modern Cinder/macOS, raw RGBA8 MSAA4; no complete Slider draw or original-release GUI certification.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(files=len(entries),renderer=renderers[0])))
