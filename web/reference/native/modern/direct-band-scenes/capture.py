#!/usr/bin/env python3
"""Rasterize independently captured native meshes; default verifies retained PNGs."""
from pathlib import Path
import argparse,hashlib,json,subprocess,tempfile
from PIL import Image
root=Path(__file__).resolve().parent
numerical=root.parents[1]/'numerical'
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);args=p.parse_args()
subprocess.run(['python3',str(numerical/'test_direct_bands.py')],check=True)
rows=json.loads((numerical/'direct-bands-outputs.json').read_text())
output=args.output or Path(tempfile.mkdtemp(prefix='gel-direct-raster-'));output.mkdir(parents=True,exist_ok=True)
header='struct Case {std::string id;std::vector<float> data;};\nstd::vector<Case> cases={\n'+',\n'.join('{"'+r['id']+'",{'+','.join(float(v).hex()+'f' for v in r['data'])+'}}' for r in rows)+'\n};\n'
(output/'cases.h').write_text(header)
subprocess.run(['clang++','-std=c++17','-O2','-framework','OpenGL','-I'+str(output),str(root/'driver.cpp'),'-o',str(output/'capture')],check=True)
runs=[]
for name in ['one','two']:
 dest=output/name;dest.mkdir(exist_ok=True)
 run=subprocess.run([str(output/'capture'),str(dest)],check=True,capture_output=True,text=True);runs.append(run.stdout)
entries=[]
for row in rows:
 for scale in [1,2]:
  for wells in [0,1]:
   key=f"{row['id']}-{scale}-{wells}";one=(output/'one'/(key+'.rgba')).read_bytes();assert one==(output/'two'/(key+'.rgba')).read_bytes()
   image=Image.frombytes('RGBA',(96*scale,64*scale),one).convert('RGB');target=root/(key+'.png')
   if args.update:image.save(target)
   else:assert image.tobytes()==Image.open(target).convert('RGB').tobytes(),key
   entries.append({'id':key,'mesh':row['id'],'scale':scale,'wells':bool(wells),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
report={'renderer':runs[0].strip(),'repeatCaptureIdentical':True,'meshSha256':hashlib.sha256((numerical/'direct-bands-outputs.json').read_bytes()).hexdigest(),'driverSha256':hashlib.sha256((root/'driver.cpp').read_bytes()).hexdigest(),'executableSha256':hashlib.sha256((output/'capture').read_bytes()).hexdigest(),'cases':entries,'limits':['Pinned native drawBands meshes and blend constants; standalone CGL raster, not original executable GUI output.','Positive-Y offscreen projection follows the independently window-validated well oracle.','macOS four-sample RGBA8; RGB only, alpha is not a visible-native contract.']}
(output/'report.json').write_text(json.dumps(report,indent=2)+'\n')
if args.update:(root/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'verified':len(entries),'output':str(output),'renderer':runs[0].strip()}))
