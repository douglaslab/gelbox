#!/usr/bin/env python3
"""Capture pinned Buffer view setup and drawing with explicit window/font adapters."""
from pathlib import Path
import argparse,subprocess,json,hashlib,tempfile
from PIL import Image
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);a=p.parse_args()
out=a.output or Path(tempfile.mkdtemp(prefix='gel-native-buffer-'));out.mkdir(exist_ok=True,parents=True)
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
sources={name:read(name) for name in ['include/Layout.h','include/Slider.h','include/Gelbox.h','src/Slider.cpp','src/GelboxApp.cpp','include/Buffer.h','src/BufferView.cpp','src/Layout.cpp','src/SliderView.cpp','include/Config.h']}
(out/'layout.inc').write_text(sources['include/Layout.h']);(out/'slider.inc').write_text(sources['include/Slider.h'])
(out/'snap.inc').write_text('\n'.join(method(sources['include/Gelbox.h'],s) for s in ['inline ci::vec2 snapToPixel','inline ci::Rectf snapToPixel']))
signatures=['void Slider::setIcon','void Slider::doLayoutInWidth','void Slider::doLayoutFromBar','void Slider::draw(','void Slider::drawGraph','void Slider::drawTextLabel','void Slider::drawNotches','float Slider::getMappedValue','float Slider::calcNormalizedValue','float\nSlider::quantize(','ci::Rectf\nSlider::calcHandleRect','ci::Rectf\nSlider::calcPickRect','ci::Rectf\nSlider::calcBounds','void Slider::addNotchAtMappedValue']
methods='\n'.join(method(sources['src/Slider.cpp'],s) for s in signatures)
assert methods.count('ci::app::getWindowContentScale()')==1
(out/'slider-methods.inc').write_text(methods.replace('ci::app::getWindowContentScale()','nativeContentScale()'))
assert 'gl::TextureFont::create( Font(kLayout.mUIFont,kLayout.mUIFontSize*2) )' in sources['src/GelboxApp.cpp']
assert 'mEnableBufferSlides = false' in ' '.join(sources['include/Config.h'].split())
header=sources['include/Buffer.h'];constants=header[header.index('// min/max'):header.index('const Buffer kBufferPresets')]
(out/'buffer.inc').write_text('namespace Gelbox { struct Buffer {static const int kNumParams=4;};\n'+constants+'\n}')
setup=method(sources['src/BufferView.cpp'],'void BufferView::makeSliders()')
(out/'buffer-style.inc').write_text(setup[setup.index('s.mEnabled ='):setup.index('// load icon')].replace('s.pullValueFromGetter();',''))
(out/'buffer-format.inc').write_text(setup[setup.index('s.mMappedValueToStr'):setup.index('s.mEnabled =')])
(out/'buffer-label.inc').write_text(setup[setup.index('TextLayout label;'):setup.index('// insert')])
setup=method(sources['src/BufferView.cpp'],'void BufferView::setup()')
(out/'buffer-text.inc').write_text(setup[setup.index('// subhead label'):setup.index('syncPresetToModel();')])
(out/'buffer-methods.inc').write_text('\n'.join(method(sources['src/BufferView.cpp'],s) for s in ['void BufferView::updateLayout()','void BufferView::draw()']))
(out/'layout-methods.inc').write_text('\n'.join(method(sources['src/Layout.cpp'],s) for s in ['ci::gl::TextureRef Layout::renderSubhead','ci::gl::TextureRef Layout::renderText','vec2 Layout::snapToPixel','Rectf Layout::snapToPixel']))
(out/'slider-view-methods.inc').write_text('\n'.join(method(sources['src/SliderView.cpp'],s) for s in ['void SliderView::setFrameAndBoundsWithSlider','void SliderView::layoutSlidersFromBar']))
assets=[f.name for f in root.glob('*.png') if f.name.startswith(('Tris','Borate','Acetate','EDTA'))]
for name in assets:assert (root/name).read_bytes()==subprocess.check_output(['git','-C',str(repo),'show',pin+':assets/molecules/'+name])
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(SliderScenes LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(slider-scenes "{root}/driver.cpp")
target_include_directories(slider-scenes PRIVATE "{out}")
target_link_libraries(slider-scenes PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True)
 renderers.append(subprocess.check_output([str(out/'build/slider-scenes'),str(root),str(dest)],text=True).strip())
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
metrics={}
for scale in [1,2]:
 name=f'metrics-{scale}.json';assert (out/'one'/name).read_bytes()==(out/'two'/name).read_bytes()
 metrics[str(scale)]=json.loads((out/'one'/name).read_text())
 for t in metrics[str(scale)]:
  name=t['id']+f'-{scale}';raw=(out/'one'/(name+'.rgba')).read_bytes();assert raw==(out/'two'/(name+'.rgba')).read_bytes()
  im=Image.frombytes('RGBA',tuple(t['size']),raw)
  if not t['topDown']:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
  target=root/(name+'.png')
  if a.update:im.save(target)
  else:assert im.tobytes()==Image.open(target).convert('RGBA').tobytes(),name
  entries.append(dict(file=target.name,sha256=sha(target.read_bytes())))
if a.update:(root/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
else:assert json.loads((root/'metrics.json').read_text())==metrics
report=dict(gelboxCommit=pin,cinderCommit=host,sourceHashes={k:sha(v.encode()) for k,v in sources.items()},methodSha256=sha(methods.encode()),inputs={f:sha((root/f).read_bytes()) for f in ['driver.cpp','capture.py','cases.json','metrics.json']+assets},renderer=renderers[0],repeatIdentical=True,files=entries,limits=['Actual pinned BufferView draw/updateLayout, setup text/style/formatter blocks, Slider and SliderView layout methods.','Window/UIFont and translation-only View adapters; getters supply fixture values after setup. Native disabled-buffer config asserted.','Buffer preset selection and stale/empty notches supplied explicitly; actual interaction/model synchronization tested separately.','Modern Cinder/macOS RGBA8 MSAA4; not original-release full GUI certification.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(verified=len(entries),renderer=renderers[0])))
