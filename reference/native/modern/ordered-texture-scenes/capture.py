#!/usr/bin/env python3
"""Independent CGL reference for ordered native mesh drawing state."""
from pathlib import Path
from PIL import Image
import argparse,hashlib,json,subprocess,tempfile,os
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);args=p.parse_args()
out=args.output or Path(tempfile.mkdtemp(prefix='gel-ordered-mesh-'));out.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
cases=json.loads((root/'cases.json').read_text())
textures=json.loads((root/'textures.json').read_text())
floats=lambda v:'{'+','.join(float(x).hex()+'f' for x in v)+'}'
ints=lambda v:'{'+','.join(str(x) for x in v)+'}'
header='struct Mip{int width,height;std::vector<unsigned char> data;};\nstd::vector<std::vector<Mip>> textures={'+','.join('{'+','.join('{'+str(m['width'])+','+str(m['height'])+','+ints(m['rgba'])+'}' for m in t['levels'])+'}' for t in textures)+'};\n'
header+='struct Op {std::vector<float> vertices,transform;std::vector<int> clip;GLenum topology;bool additive;int texture;std::vector<float> tint;bool premultiplied;GLenum minFilter,magFilter,address;};\nstruct Case {std::string id;std::vector<Op> ops;};\nstd::vector<Case> cases={\n'
items=[]
for case in cases:
 ops=[]
 for op in case['ops']:
  a,b,c,d,x,y=op.get('transform',[1,0,0,1,0,0]);matrix=[a,b,0,c,d,0,x,y,1]
  vertices=op.get('vertices',[])
  if 'texture' in op:
   x1,y1,x2,y2=op['rect'];u1,v1,u2,v2=op['uv']
   vertices=[v for point in [(x1,y1,u1,v1),(x2,y1,u2,v1),(x2,y2,u2,v2),(x1,y1,u1,v1),(x2,y2,u2,v2),(x1,y2,u1,v2)] for v in point]
  filter='GL_NEAREST' if op.get('filter')=='nearest' else 'GL_LINEAR'
  minimum=filter+('_MIPMAP_'+op['mipmap'].upper() if op.get('mipmap','none')!='none' else '')
  ops.append('{'+','.join([floats(vertices),floats(matrix),ints(op.get('scissor',[])),'GL_TRIANGLES','true' if op.get('blend')=='additive' else 'false',str(op.get('texture',-1)),floats(op.get('tint',[1,1,1,1])),'true' if op.get('alpha')=='premultiplied' else 'false',minimum,filter,'GL_REPEAT' if op.get('address')=='repeat' else 'GL_CLAMP_TO_EDGE'])+'}')
 items.append('{"'+case['id']+'",{'+','.join(ops)+'}}')
(out/'cases.h').write_text(header+',\n'.join(items)+'\n};\n')
subprocess.run(['clang++','-std=c++17','-O2','-framework','OpenGL','-I'+str(out),str(root/'driver.cpp'),'-o',str(out/'capture')],check=True)
renderers=[]
for name in ['one','two']:
 dest=out/name;dest.mkdir(exist_ok=True);renderers.append(subprocess.check_output([str(out/'capture'),str(dest)],text=True).strip())
assert renderers[0]==renderers[1]
entries=[]
for case in cases:
 for scale in [1,2]:
  key=f"{case['id']}-{scale}";raw=(out/'one'/(key+'.rgba')).read_bytes();assert raw==(out/'two'/(key+'.rgba')).read_bytes()
  im=Image.frombytes('RGBA',(64*scale,64*scale),raw).convert('RGB');target=root/(key+'.png')
  if args.update:im.save(target)
  else:assert im.tobytes()==Image.open(target).convert('RGB').tobytes(),key
  entries.append(dict(id=key,scene=case['id'],scale=scale,sha256=sha(target)))
repo=Path(os.environ.get('GELBOX_REFERENCE_REPO','/Users/shawn/code/gelbox'))
commit='5f5109705279085fcf6bcac6c8be1c9806b6d3d6'
sources={f:subprocess.check_output(['git','-C',str(repo),'show',commit+':'+f]) for f in ['src/GelboxApp.cpp','src/GelView.cpp','src/View.cpp','src/Layout.cpp']}
assert b'RendererGl::Options().msaa(4)' in sources['src/GelboxApp.cpp']
assert b'GL_SRC_ALPHA, GL_ONE' in sources['src/GelView.cpp']
cinder=Path(os.environ.get('CINDER_REFERENCE_REPO','/Users/shawn/code/Cinder'))
cinder_commit='75f4821216a0e105075f3c55be1fbe38784a18c6'
texture_source=subprocess.check_output(['git','-C',str(cinder),'show',cinder_commit+':src/cinder/gl/Texture.cpp'])
text_header=subprocess.check_output(['git','-C',str(cinder),'show',cinder_commit+':include/cinder/Text.h'])
assert b'gl::Texture2d::Format().mipmap()' in sources['src/Layout.cpp']
assert b'label.render(true)' in sources['src/Layout.cpp']
assert b'premultiplied = false' in text_header
report=dict(gelboxCommit=commit,cinderCommit=cinder_commit,textureSourceSha256=hashlib.sha256(texture_source).hexdigest(),textHeaderSha256=hashlib.sha256(text_header).hexdigest(),sourceSha256={k:hashlib.sha256(v).hexdigest() for k,v in sources.items()},driverSha256=sha(root/'driver.cpp'),casesSha256=sha(root/'cases.json'),texturesSha256=sha(root/'textures.json'),executableSha256=sha(out/'capture'),renderer=renderers[0],repeatCaptureIdentical=True,cases=entries,limits=['Constructed standalone CGL scenes using native draw-state contracts; not original GUI captures.','Logical positive-Y coordinates/raw row order; scissor coordinates multiplied by DPR; physical one-pixel lines.','64x64 RGBA8 MSAA4; straight/premultiplied RGBA8 textures with explicit diagnostic mip levels; no app integration or image-decoder certification.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if args.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'verified':len(entries),'renderer':renderers[0],'output':str(out)}))
