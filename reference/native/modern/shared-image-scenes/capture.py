#!/usr/bin/env python3
"""Actual native image decode/Texture2d mipmaps and extracted ImageView drawing."""
from pathlib import Path
import argparse,subprocess,json,hashlib,tempfile
from PIL import Image
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);a=p.parse_args()
out=a.output or Path(tempfile.mkdtemp(prefix='gel-native-image-'));out.mkdir(exist_ok=True,parents=True)
cinder=Path('/Users/shawn/code/Cinder');repo=Path('/Users/shawn/code/gelbox');pin='5f5109705279085fcf6bcac6c8be1c9806b6d3d6';host='f90f332d1a4d453282c76435f3401271f25922f9'
assert subprocess.check_output(['git','-C',str(cinder),'rev-parse','HEAD'],text=True).strip()==host
assert not subprocess.check_output(['git','-C',str(cinder),'status','--porcelain'])
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=subprocess.check_output(['git','-C',str(repo),'show',pin+':src/ImageView.cpp'],text=True)
parts=[]
for signature in ['void ImageView::draw()','void ImageView::drawFrame()','ci::Rectf ImageView::calcResizeBox() const']:
 start=source.index(signature);brace=source.index('{',start);depth=1;end=brace+1
 while depth:
  if source[end]=='{':depth+=1
  elif source[end]=='}':depth-=1
  end+=1
 parts.append(source[start:end])
(out/'image-methods.inc').write_text('\n'.join(parts))
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(ImageScenes LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(image-textures "{root}/textures.cpp")
add_executable(image-scenes "{root}/driver.cpp")
target_include_directories(image-scenes PRIVATE "{out}")
target_link_libraries(image-textures PRIVATE cinder)
target_link_libraries(image-scenes PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True)
 subprocess.run([str(out/'build/image-textures'),str(root/'alpha.png'),str(root/'odd.png'),str(dest/'textures.json')],check=True)
 renderers.append(subprocess.check_output([str(out/'build/image-scenes'),str(root),str(root/'cases.json'),str(dest)],text=True).strip())
assert renderers[0]==renderers[1]
assert (out/'one/textures.json').read_bytes()==(out/'two/textures.json').read_bytes()
if a.update:(root/'textures.json').write_bytes((out/'one/textures.json').read_bytes())
else:assert (root/'textures.json').read_bytes()==(out/'one/textures.json').read_bytes()
entries=[]
for c in json.loads((root/'cases.json').read_text()):
 for scale in [1,2]:
  key=c['id']+'-'+str(scale);data=(out/'one'/(key+'.rgba')).read_bytes();assert data==(out/'two'/(key+'.rgba')).read_bytes()
  image=Image.frombytes('RGBA',(400*scale,300*scale),data).convert('RGB');target=root/(key+'.png')
  if a.update:image.save(target)
  else:assert image.tobytes()==Image.open(target).convert('RGB').tobytes(),key
  entries.append(dict(id=key,scene=c['id'],scale=scale,sha256=sha(target)))
report=dict(gelboxCommit=pin,cinderCommit=host,sourceSha256=hashlib.sha256(source.encode()).hexdigest(),extractedSha256=sha(out/'image-methods.inc'),inputs={p:sha(root/p) for p in ['driver.cpp','textures.cpp','cases.json','alpha.png','odd.png','textures.json']},executables={p:sha(out/'build'/p) for p in ['image-textures','image-scenes']},renderer=renderers[0],repeatIdentical=True,cases=entries,limits=['Pinned ImageView draw/drawFrame/resize-box methods verbatim with frame/focus adapters, modern Cinder actual decode/Texture2d/drawing.','Standalone CGL RGBA8 MSAA4, positive-Y projection and raw row order; not original-release GUI.','8-bit PNG fixtures only; native texture levels are bottom-up, browser canonical image levels are top-down.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(verified=len(entries),renderer=renderers[0])))
