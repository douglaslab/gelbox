#!/usr/bin/env python3
"""Capture unchanged native getDyes/drawBackground with actual Cinder Color math."""
import argparse,hashlib,json,os,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--update',action='store_true');p.add_argument('--output',type=Path);a=p.parse_args()
native=Path(os.environ.get('GELBOX_REFERENCE_REPO','/Users/shawn/code/gelbox'));cinder=Path(os.environ.get('CINDER_REFERENCE_REPO','/Users/shawn/code/Cinder'))
revision='5f5109705279085fcf6bcac6c8be1c9806b6d3d6';cinder_revision='f90f332d1a4d453282c76435f3401271f25922f9'
run=lambda *cmd:subprocess.check_output(cmd)
sha=lambda data:hashlib.sha256(data).hexdigest()
assert run('git','-C',str(cinder),'rev-parse','HEAD').decode().strip()==cinder_revision
assert not run('git','-C',str(cinder),'status','--porcelain').strip()
source={name:run('git','-C',str(native),'show',revision+':'+name) for name in ['src/MolecularSim.cpp','src/Sample.cpp','include/Dye.h','include/Layout.h','include/GelSim.h']}
assert b'Color::hex( 0xF1F1F2 )' in source['include/Layout.h']
assert b'mSliderDyeMassMax = Dye::kMaxMass;' in source['include/GelSim.h']
assert b'kMaxMass = 125.f;' in source['include/Dye.h']
output=a.output or Path(tempfile.mkdtemp(prefix='gel-background-'));output.mkdir(exist_ok=True,parents=True)
extracted={}
for name,signature,destination in [('src/MolecularSim.cpp','void MolecularSim::drawBackground( int highlight )','background.inc'),('src/Sample.cpp','std::vector<float> Sample::getDyes() const','get-dyes.inc')]:
 text=source[name].decode();assert text.count(signature)==1;start=text.index(signature);method=text[start:text.index('\n}',start)+2]+'\n';(output/destination).write_text(method);extracted[destination]=sha(method.encode())
(output/'Dye.h').write_bytes(source['include/Dye.h'])
command=['clang++','-std=c++17','-Wno-deprecated-literal-operator','-I'+str(cinder/'include'),'-I'+str(output),str(root/'driver.cpp'),'-o',str(output/'capture')]
subprocess.run(command,check=True)
one=run(str(output/'capture'),str(root/'cases.json'));two=run(str(output/'capture'),str(root/'cases.json'));assert one==two
subprocess.run(['clang++','-std=c++17','-framework','OpenGL',str(root/'pixels.cpp'),'-o',str(output/'pixels')],check=True)
rows=json.loads(one);colors=''.join(' '.join(map(str,row['color']))+'\n' for row in rows)
pixels=subprocess.run([str(output/'pixels')],input=colors,text=True,capture_output=True,check=True)
pixels2=subprocess.run([str(output/'pixels')],input=colors,text=True,capture_output=True,check=True)
assert pixels.stdout==pixels2.stdout
for row,pixel in zip(rows,pixels.stdout.splitlines(),strict=True):row['rgb']=[int(v) for v in pixel.split()]
one=(json.dumps(rows,indent=2)+'\n').encode()
if a.update:(root/'outputs.json').write_bytes(one)
else:assert one==(root/'outputs.json').read_bytes()
manifest={'nativeCommit':revision,'cinderCommit':cinder_revision,'sourceHashes':{k:sha(v) for k,v in source.items()},'extractedHashes':extracted,'colorHeaderSha256':sha((cinder/'include/cinder/Color.h').read_bytes()),'driverSha256':sha((root/'driver.cpp').read_bytes()),'casesSha256':sha((root/'cases.json').read_bytes()),'outputsSha256':sha(one),'executableSha256':sha((output/'capture').read_bytes()),'compiler':run('clang++','--version').decode(),'command':command,'repeatIdentical':True,'pixelDriverSha256':sha((root/'pixels.cpp').read_bytes()),'renderer':pixels.stderr.strip(),'limits':['Adapter supplies parsed fragments and effective default background/slider mass constants. Original getDyes and drawBackground bodies are unchanged.','GL calls capture computed Color; this is numeric output, not native GUI/raster certification.']}
(output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
if a.update:(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Verified {len(json.loads(one))} native background scenarios twice identically')
