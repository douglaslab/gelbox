"""Rebuild the pinned Cinder source in a fresh directory; never replace sibling files."""
import argparse,hashlib,io,json,subprocess,tarfile
from pathlib import Path

COMMIT='f90f332d1a4d453282c76435f3401271f25922f9'
p=argparse.ArgumentParser();p.add_argument('--repository',required=True);p.add_argument('--output',required=True);p.add_argument('--map-source-path',action='store_true');a=p.parse_args()
out=Path(a.output).resolve();assert not out.exists(),'Use a new output directory'
source=out/'source';source.mkdir(parents=True)
archive=subprocess.check_output(['git','-C',a.repository,'archive',COMMIT])
with tarfile.open(fileobj=io.BytesIO(archive)) as t:t.extractall(source,filter='data')
args=['cmake','-S',str(source),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release']
if a.map_source_path:
 flag=f'-ffile-prefix-map={source}=/Users/shawn/code/Cinder'
 args += [f'-DCMAKE_C_FLAGS={flag}',f'-DCMAKE_CXX_FLAGS={flag}']
with (out/'configure.log').open('w') as log:subprocess.run(args,stdout=log,stderr=subprocess.STDOUT,check=True)
with (out/'build.log').open('w') as log:subprocess.run(['cmake','--build',str(out/'build'),'-j','6'],stdout=log,stderr=subprocess.STDOUT,check=True)
lib=source/'lib/macosx/Release/libcinder.a'
(out/'result.json').write_text(json.dumps({'commit':COMMIT,'archive_sha256':hashlib.sha256(archive).hexdigest(),'configure':args,'library_sha256':hashlib.sha256(lib.read_bytes()).hexdigest()},indent=2)+'\n')
print(lib)
