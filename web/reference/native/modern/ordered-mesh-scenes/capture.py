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
header='struct Op {std::vector<float> vertices,transform;std::vector<int> clip;GLenum topology;bool additive;};\nstruct Case {std::string id;std::vector<Op> ops;};\nstd::vector<Case> cases={\n'
items=[]
for case in cases:
 ops=[]
 native_ops=list(case['ops'])
 for well in case.get('wells',[]):
  x1,y1,x2,y2=(well[k] for k in ['x1','y1','x2','y2'])
  native_ops.append(dict(vertices=[v for point in [(x1,y1),(x2,y1),(x2,y2),(x1,y2),(x1,y1)] for v in [*point,.8,.8,.8,.8]],topology='line-strip',blend='over'))
 for op in native_ops:
  a,b,c,d,x,y=op.get('transform',[1,0,0,1,0,0]);matrix=[a,b,0,c,d,0,x,y,1]
  floats=lambda v:'{'+','.join(float(x).hex()+'f' for x in v)+'}'
  ints=lambda v:'{'+','.join(str(x) for x in v)+'}'
  topology={'triangle-list':'GL_TRIANGLES','line-list':'GL_LINES','line-strip':'GL_LINE_STRIP'}[op.get('topology','triangle-list')]
  ops.append('{'+','.join([floats(op['vertices']),floats(matrix),ints(op.get('scissor',[])),topology,'true' if op.get('blend')=='additive' else 'false'])+'}')
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
sources={f:subprocess.check_output(['git','-C',str(repo),'show',commit+':'+f]) for f in ['src/GelboxApp.cpp','src/GelView.cpp','src/View.cpp']}
assert b'RendererGl::Options().msaa(4)' in sources['src/GelboxApp.cpp']
assert b'GL_SRC_ALPHA, GL_ONE' in sources['src/GelView.cpp']
report=dict(gelboxCommit=commit,sourceSha256={k:hashlib.sha256(v).hexdigest() for k,v in sources.items()},driverSha256=sha(root/'driver.cpp'),casesSha256=sha(root/'cases.json'),executableSha256=sha(out/'capture'),renderer=renderers[0],repeatCaptureIdentical=True,cases=entries,limits=['Constructed standalone CGL scenes using native draw-state contracts; not original GUI captures.','Logical positive-Y coordinates/raw row order; scissor coordinates multiplied by DPR; physical one-pixel lines.','64x64 display-domain RGBA8 MSAA4; opaque RGB comparison. No textures or app integration.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if args.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'verified':len(entries),'renderer':renderers[0],'output':str(out)}))
