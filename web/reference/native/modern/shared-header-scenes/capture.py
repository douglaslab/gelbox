#!/usr/bin/env python3
"""Capture pinned native SampleView header text, placement, and ordered paint."""
from pathlib import Path
import argparse,subprocess,json,hashlib,tempfile
from PIL import Image
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);a=p.parse_args()
out=a.output or Path(tempfile.mkdtemp(prefix='gel-native-header-'));out.mkdir(exist_ok=True,parents=True)
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
layout=read('include/Layout.h');cpp=read('src/Layout.cpp');sample=read('src/SampleView.cpp')
(out/'layout.inc').write_text(layout)
methods='\n'.join(method(cpp,s) for s in ['vec2 Layout::snapToPixel','Rectf Layout::snapToPixel','ci::gl::TextureRef Layout::renderHead','ci::gl::TextureRef Layout::renderText','ci::Rectf Layout::layoutHeadingText'])
(out/'layout-methods.inc').write_text(methods)
header=method(sample,'void SampleView::drawHeader()');(out/'header-method.inc').write_text(header)
layout_body=method(sample,'void SampleView::layout()');fragment=layout_body[layout_body.index('\tif (mMicrotubeIcon)'):layout_body.index('\tmMolecularSim.setBounds')];(out/'header-layout.inc').write_text(fragment)
tube=root.parent/'shared-tube-scenes/microtube1500ul.png'
assert tube.read_bytes()==subprocess.check_output(['git','-C',str(repo),'show',pin+':assets/microtube1500ul.png'])
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(HeaderScenes LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(header-scenes "{root}/driver.cpp")
target_include_directories(header-scenes PRIVATE "{out}")
target_link_libraries(header-scenes PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True)
 renderers.append(subprocess.check_output([str(out/'build/header-scenes'),str(tube),str(dest)],text=True).strip())
assert renderers[0]==renderers[1]
for f in (out/'one').iterdir():assert f.read_bytes()==(out/'two'/f.name).read_bytes(),f.name
metrics=json.loads((out/'one/metrics.json').read_text());entries=[]
for m in metrics:
 scale=m['scale'];assert m['level1Width']==0 and m['minFilter']==9729 and m['magFilter']==9729
 data=(out/'one'/f'sample-{scale}.rgba').read_bytes()
 tex=Image.frombytes('RGBA',(m['width'],m['height']),data)
 if not m['topDown']:tex=tex.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
 target=root/f'sample-{scale}.png'
 if a.update:tex.save(target)
 else:assert tex.tobytes()==Image.open(target).convert('RGBA').tobytes()
 entries.append(dict(file=target.name,sha256=sha(target.read_bytes())))
 for name in ['integer','fractional']:
  image=Image.frombytes('RGBA',(320*scale,160*scale),(out/'one'/f'{name}-{scale}.rgba').read_bytes()).convert('RGB');target=root/f'{name}-{scale}.png'
  if a.update:image.save(target)
  else:assert image.tobytes()==Image.open(target).convert('RGB').tobytes()
  entries.append(dict(file=target.name,sha256=sha(target.read_bytes())))
if a.update:(root/'metrics.json').write_bytes((out/'one/metrics.json').read_bytes())
else:assert (root/'metrics.json').read_bytes()==(out/'one/metrics.json').read_bytes()
report=dict(gelboxCommit=pin,cinderCommit=host,sourceHashes={k:sha(v.encode()) for k,v in {'layout':layout,'layoutMethods':methods,'sampleView':sample,'drawHeader':header,'headerLayout':fragment}.items()},inputs={f:sha((root/f).read_bytes()) for f in ['driver.cpp','capture.py','../shared-tube-scenes/microtube1500ul.png']},renderer=renderers[0],repeatIdentical=True,files=entries,limits=['Pinned SampleView drawHeader and contiguous header layout, pinned Layout renderHead/renderText/layoutHeadingText/snap methods.','Modern Cinder and installed macOS Avenir-Heavy rasterization; not certification of original-release GUI or other fonts/platforms.','Raw RGBA text texture preserves straight alpha; one level and linear filtering. Scene captures use RGBA8 MSAA4, raw rows, no screenshot color conversion.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(verified=len(entries),metrics=metrics)))
