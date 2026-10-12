#!/usr/bin/env python3
"""Compile/run native OpenGL oracle; require window agreement before colored output.
Default verifies retained references. --update explicitly writes colored PNGs.
Requires macOS command-line tools and Pillow; no application UI or Cinder build.
"""
from pathlib import Path
import argparse, hashlib, json, subprocess, tempfile
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--update',action='store_true')
parser.add_argument('--output',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parent
cases=json.loads((root.parent/'cases.json').read_text())
header='#include <array>\nstruct Case {std::string id;int scale;std::vector<std::array<float,4>> rects;};\nstd::vector<Case> cases={\n'
for case in cases:
    header+='{"'+case['id']+'",'+str(case['scale'])+', {'+','.join('{{'+','.join(float(v).hex()+'f' for v in rect)+'}}' for rect in case['rects'])+'}},\n'
header+='};\n'
assert header==(root/'cases.h').read_text(), 'Native geometry header does not match retained window cases'
output=args.output or Path(tempfile.mkdtemp(prefix='gel-well-native-'))
output.mkdir(parents=True,exist_ok=True)
subprocess.run(['clang++','-std=c++17','-O2','-framework','OpenGL',str(root/'driver.cpp'),'-o',str(output/'capture')],check=True)
run=subprocess.run([str(output/'capture'),str(output)],check=True,text=True,capture_output=True)
(output/'run.log').write_text(run.stdout+run.stderr)
read=lambda path: Image.open(path).convert('RGB').tobytes()
reports=[]
for case in cases:
    extent=(390*case['scale'],50*case['scale'])
    image=Image.frombytes('RGBA',extent,(output/(case['id']+'-0-1.rgba')).read_bytes()).convert('RGB')
    expected=read(root.parent/(case['id']+'.png'))
    different=sum(a!=b for a,b in zip(image.tobytes(),expected))
    reports.append({'id':case['id'],'differentChannels':different})
assert all(report['differentChannels']==0 for report in reports), reports
# Only extend the matrix after every native window reference agrees.
colored=[]
for case in cases:
    for background in (1,2):
        entry={**case,'id':case['id']+'-base-'+str(background),'background':background}
        image=Image.frombytes('RGBA',(390*case['scale'],50*case['scale']),(output/(case['id']+'-'+str(background)+'-1.rgba')).read_bytes()).convert('RGB')
        target=root/(entry['id']+'.png')
        if args.update:image.save(target)
        else:assert image.tobytes()==read(target), target
        colored.append(entry)
for background in (1,2):
    image=Image.frombytes('RGBA',(390,50),(output/('base-'+str(background)+'.rgba')).read_bytes()).convert('RGB')
    target=root/('base-'+str(background)+'.png')
    if args.update:image.save(target)
    else:assert image.tobytes()==read(target), target
if args.update:(root/'cases.json').write_text(json.dumps(colored,indent=2)+'\n')
else:assert colored==json.loads((root/'cases.json').read_text())
report={'renderer':run.stdout.strip(),'windowComparisons':reports,'coloredCasesVerified':len(colored),'captureSha256':hashlib.sha256((output/'capture').read_bytes()).hexdigest()}
(output/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'windowMatches':len(reports),'coloredMatches':len(colored),'output':str(output)}))
