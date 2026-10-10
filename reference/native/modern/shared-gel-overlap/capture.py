#!/usr/bin/env python3
"""Pinned native particle meshes and source-derived gel, SampleView and FragmentView composition."""
from pathlib import Path
import argparse,hashlib,json,subprocess,tempfile
from PIL import Image
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);p.add_argument('--mesh-build',type=Path,default=Path('/tmp/gel-native-numerical'));args=p.parse_args()
out=args.output or Path(tempfile.mkdtemp(prefix='gel-shared-view-native-'));out.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
num=root.parents[1]/'numerical';prov=json.loads((num/'provenance.json').read_text());exe=args.mesh_build/'build/gel-mesh';assert sha(exe)==prov['meshExecutableSha256']
cases=json.loads((root/'cases.json').read_text());inputs=[]
for c in cases:
 for mode in ['sample','representative']:
  row=json.loads(json.dumps(c));row['id']=c['id']+'-'+mode
  if mode=='representative':row['part']['loc']={'x':117,'y':111}
  inputs.append(row)
(out/'mesh-inputs.json').write_text(json.dumps(inputs))
cmd=[str(exe),str(args.mesh_build/'pinned/assets/tuning/gel-sim.json'),str(out/'mesh-inputs.json'),str(args.mesh_build/'pinned/assets/tuning/molecular-sim.json')]
raw=subprocess.check_output(cmd);assert raw==subprocess.check_output(cmd)
if args.update:(root/'meshes.json').write_bytes(raw)
else:assert raw==(root/'meshes.json').read_bytes()
meshes={row['id']:row['data'] for row in json.loads(raw)}
floats=lambda a:'{'+','.join(float(v).hex()+'f' for v in a)+'}'
header='struct Case {std::string id;std::vector<float> sample,representative;float sx,sy,sw,sh,fx,fy;bool visible,sampleLast;float gx,gy;bool gelLast,effects;};\nstd::vector<Case> cases={\n'
rows=[]
for c in cases:
 r=c['sampleRect'];f=c['fragmentOrigin'];numbers=[r['left'],r['top'],r['width'],r['height'],f['x'],f['y']]
 rows.append('{"'+c['id']+'",'+floats(meshes[c['id']+'-sample'])+','+floats(meshes[c['id']+'-representative'])+','+','.join(float(v).hex()+'f' for v in numbers)+','+str(c['part']['fade']>0).lower()+','+str(c['sampleLast']).lower()+','+float(c['gel']['left']).hex()+'f,'+float(c['gel']['top']).hex()+'f,'+str(c['gel']['last']).lower()+','+str(c['gel']['mode']=='effects').lower()+'}')
(out/'cases.h').write_text(header+',\n'.join(rows)+'\n};\n')
well=root.parent/'fragment-well-scenes';assert sha(well/'geometry.json')==json.loads((root.parent/'fragment-edge-scenes/manifest.json').read_text())['geometrySha256'];geometry=json.loads((well/'geometry.json').read_text());g=''
for name,gray in [('shadow',240),('fill',241),('stroke',189)]:
 points=geometry[name];values=[v for i in range(0,len(points),2) for v in [points[i],points[i+1],gray/255,gray/255,gray/255,1]]
 g+='std::vector<float> '+name+'='+floats(values)+';\n'
(out/'geometry.h').write_text(g)

# Independent native scientific output and drawBands geometry, never web output.
raster=root.parent/'raster-scenes';raster_manifest=json.loads((raster/'manifest.json').read_text())
assert sha(raster/'plain-1.png')==raster_manifest['captures']['plain-1.png']
subprocess.run(['python3',str(num/'test_direct_bands.py')],check=True)
direct=json.loads((num/'direct-bands-outputs.json').read_text())
data=next(c['data'] for c in direct if c['id']=='overlap')
texture=Image.open(raster/'plain-1.png').convert('RGBA');assert texture.size==(96,128)
(out/'gel.h').write_text('std::vector<float> gelMesh='+floats(data)+';\nunsigned char gelPixels[]={'+','.join(map(str,texture.tobytes()))+'};\n')

subprocess.run(['clang++','-std=c++17','-O2','-framework','OpenGL','-I'+str(out),str(root/'driver.cpp'),'-o',str(out/'capture')],check=True)
renderers=[]
for run in ['one','two']:
 dest=out/run;dest.mkdir(exist_ok=True);renderers.append(subprocess.check_output([str(out/'capture'),str(dest)],text=True).strip())
assert renderers[0]==renderers[1];entries=[]
for c in cases:
 for scale in [1,2]:
  key=c['id']+'-'+str(scale);raw=(out/'one'/(key+'.rgba')).read_bytes();assert raw==(out/'two'/(key+'.rgba')).read_bytes()
  image=Image.frombytes('RGBA',(400*scale,300*scale),raw).convert('RGB');target=root/(key+'.png')
  if args.update:image.save(target)
  else:assert image.tobytes()==Image.open(target).convert('RGB').tobytes(),key
  entries.append(dict(id=key,scene=c['id'],scale=scale,sha256=sha(target)))
commit='5f5109705279085fcf6bcac6c8be1c9806b6d3d6';repo='/Users/shawn/code/gelbox'
sources={p:subprocess.check_output(['git','-C',repo,'show',commit+':'+p]) for p in ['src/GelView.cpp','src/GelRender.cpp','src/SampleView.cpp','src/FragmentView.cpp','src/View.cpp','src/GelboxApp.cpp','src/MolecularSim.cpp','include/Layout.h']}
assert b'RendererGl::Options().msaa(4)' in sources['src/GelboxApp.cpp']
assert b'gl::ScopedScissor' in sources['src/SampleView.cpp']
assert b'0xF1F1F2' in sources['include/Layout.h']
report=dict(scientificTextureSha256=sha(raster/'plain-1.png'),scientificManifestSha256=sha(raster/'manifest.json'),directMeshSha256=sha(num/'direct-bands-outputs.json'),directProvenanceSha256=sha(num/'direct-bands-provenance.json'),gelboxCommit=commit,sourceSha256={p:hashlib.sha256(v).hexdigest() for p,v in sources.items()},numericalProvenanceSha256=sha(num/'provenance.json'),geometrySha256=sha(well/'geometry.json'),geometryProvenanceSha256=sha(well/'geometry-provenance.json'),casesSha256=sha(root/'cases.json'),meshSha256=sha(root/'meshes.json'),driverSha256=sha(root/'driver.cpp'),renderer=renderers[0],executableSha256=sha(out/'capture'),repeatCaptureIdentical=True,meshCaptureRepeated=True,cases=entries,limits=['Static pinned-native particle meshes on standalone CGL RGBA8 MSAA4; not original GUI output.','Fractionally translated direct/effects gel with native wells, sample body and fragment representative, gel first/last.','No header, focus/frame, brace, control or text paint; those contributions migrate in Task4.'])
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if args.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(dict(verified=len(entries),renderer=renderers[0])))
