#!/usr/bin/env python3
"""Capture pinned inspector heading text, placement and rule paint."""
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
methods='\n'.join(method(cpp,s) for s in ['vec2 Layout::snapToPixel','Rectf Layout::snapToPixel','ci::gl::TextureRef Layout::renderHead','ci::gl::TextureRef Layout::renderSubhead','ci::gl::TextureRef Layout::renderText','ci::Rectf Layout::layoutHeadingText'])
(out/'layout-methods.inc').write_text(methods)
sources={k:read('src/'+v+'.cpp') for k,v in {'gel-settings':'GelSettingsView','sample-settings':'SampleSettingsView','fragment':'FragmentView'}.items()}
parts=[]
for kind,cls in [('gel-settings','GelSettingsView'),('sample-settings','SampleSettingsView')]:
 parts.append(method(sources[kind],'void '+cls+'::draw()'))
 layout_body=method(sources[kind],'void '+cls+'::layout()')
 start=layout_body.index('\tif (mSubheadTex)' if kind=='sample-settings' else '\tif (mHeadingTex)')
 (out/(kind+'-layout.inc')).write_text(layout_body[start:layout_body.rindex('}')])
fragment_draw=method(sources['fragment'],'void FragmentView::draw()')
fragment_heading=fragment_draw[fragment_draw.index('\tif (mHeadingTex)'):fragment_draw.rindex('}')]
parts.append('void FragmentView::draw(){\n'+fragment_heading+'\n}')
(out/'draw-methods.inc').write_text('\n'.join(parts))
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(InspectorHeadings LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(inspector-headings "{root}/driver.cpp")
target_include_directories(inspector-headings PRIVATE "{out}")
target_link_libraries(inspector-headings PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True)
 renderers.append(subprocess.check_output([str(out/'build/inspector-headings'),str(dest)],text=True).strip())
assert renderers[0]==renderers[1]
for f in (out/'one').iterdir():assert f.read_bytes()==(out/'two'/f.name).read_bytes(),f.name
metrics=json.loads((out/'one/metrics.json').read_text());entries=[]
for kind,scales in metrics.items():
 for scale_str,scene in scales.items():
  scale=int(scale_str)
  for texture in scene['textures']:
   name=texture['id']+('-2' if scale==2 else '-1');data=(out/'one'/(name+'.rgba')).read_bytes()
   im=Image.frombytes('RGBA',tuple(texture['size']),data)
   if not texture['topDown']:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
   target=root/(name+'.png')
   if a.update:im.save(target)
   else:assert im.tobytes()==Image.open(target).convert('RGBA').tobytes()
   entries.append(dict(file=target.name,sha256=sha(target.read_bytes())))
  for front in ['behind','front']:
   name=kind+'-'+front+'-'+scale_str;im=Image.frombytes('RGBA',(400*scale,460*scale),(out/'one'/(name+'.rgba')).read_bytes()).convert('RGB');target=root/(name+'.png')
   if a.update:im.save(target)
   else:assert im.tobytes()==Image.open(target).convert('RGB').tobytes(),name
   entries.append(dict(file=target.name,sha256=sha(target.read_bytes())))
if a.update:(root/'metrics.json').write_bytes((out/'one/metrics.json').read_bytes())
else:assert (root/'metrics.json').read_bytes()==(out/'one/metrics.json').read_bytes()
report=dict(gelboxCommit=pin,cinderCommit=host,sourceHashes={k:sha(v.encode()) for k,v in {'layout':layout,'layoutMethods':methods,**sources}.items()},extractedHashes={f.name:sha(f.read_bytes()) for f in out.glob('*.inc')},inputs={f:sha((root/f).read_bytes()) for f in ['driver.cpp','capture.py','metrics.json']},renderer=renderers[0],repeatIdentical=True,files=entries,limits=['Full pinned GelSettingsView/SampleSettingsView draw with null brace textures; only pinned FragmentView heading draw block, not its well/representative.','Pinned heading layout blocks and Layout text/snap methods; no child controls.','Modern Cinder/macOS Avenir Heavy, RGBA8 MSAA4 raw pixels; not original-release GUI.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(verified=len(entries),metrics=metrics)))
