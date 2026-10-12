#!/usr/bin/env python3
"""Capture pinned native SampleView paint and its new-species child button."""
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
button_source=read('src/ButtonView.cpp')
button_methods='\n'.join(method(button_source,s) for s in ['ColorA ButtonView::stateColor( ColorA c, ColorA disabledColor ) const','void ButtonView::draw()','void ButtonView::drawFill() const','void ButtonView::drawFrame() const'])
(out/'button-methods.inc').write_text(button_methods)
draw=method(sample,'void SampleView::draw()');(out/'sample-draw.inc').write_text(draw)
for name in ['new-btn.png','new-btn@2x.png']:
 assert (root/name).read_bytes()==subprocess.check_output(['git','-C',str(repo),'show',pin+':assets/'+name])
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(SampleScenes LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(sample-scenes "{root}/driver.cpp")
target_include_directories(sample-scenes PRIVATE "{out}")
target_link_libraries(sample-scenes PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True)
 renderers.append(subprocess.check_output([str(out/'build/sample-scenes'),str(root),str(dest)],text=True).strip())
assert renderers[0]==renderers[1]
entries=[]
for c in json.loads((root/'cases.json').read_text()):
 for scale in [1,2]:
  name=c['id']+'-'+str(scale);data=(out/'one'/(name+'.rgba')).read_bytes();assert data==(out/'two'/(name+'.rgba')).read_bytes()
  image=Image.frombytes('RGBA',(400*scale,400*scale),data).convert('RGB');target=root/(name+'.png')
  if a.update:image.save(target)
  else:assert image.tobytes()==Image.open(target).convert('RGB').tobytes(),name
  entries.append(dict(file=target.name,sha256=sha(target.read_bytes())))
report=dict(gelboxCommit=pin,cinderCommit=host,sourceHashes={k:sha(v.encode()) for k,v in {'layout':layout,'layoutMethods':methods,'sampleView':sample,'drawHeader':header,'headerLayout':fragment,'sampleDraw':draw,'buttonSource':button_source,'buttonMethods':button_methods,'molecularSource':read('src/MolecularSim.cpp')}.items()},inputs={f:sha((root/f).read_bytes()) for f in ['driver.cpp','capture.py','cases.json','new-btn.png','new-btn@2x.png','../shared-tube-scenes/microtube1500ul.png']},renderer=renderers[0],repeatIdentical=True,files=entries,limits=['Pinned SampleView draw/drawHeader, header layout, Layout text/snap methods and ButtonView drawing methods.','Empty molecular simulation adapter paints the native dye-free background; no particles or callout. Scissor has no visible contribution in these empty scenes.','Modern Cinder/macOS font rasterization, RGBA8 MSAA4 raw pixels; not original-release GUI.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(verified=len(entries),renderer=renderers[0])))
