#!/usr/bin/env python3
"""Reconstruct the recorded compatibility source without using sibling edits."""
import argparse,hashlib,io,json,pathlib,shutil,subprocess,tarfile
p=argparse.ArgumentParser();p.add_argument('--gelbox',required=True);p.add_argument('--cinder',required=True);p.add_argument('--build',default='/tmp/gel-native-modern-reproduction');a=p.parse_args()
r=pathlib.Path(__file__).resolve().parent;m=json.loads((r/'manifest.json').read_text());out=pathlib.Path(a.build).resolve();source=out/'source'
assert not out.exists(), 'Use a fresh build directory; existing data is never replaced'
assert subprocess.check_output(['git','-C',a.cinder,'rev-parse','HEAD']).decode().strip()==m['cinderCommit']
assert not subprocess.check_output(['git','-C',a.cinder,'status','--porcelain'])
assert hashlib.sha256((pathlib.Path(a.cinder)/'lib/macosx/Release/libcinder.a').read_bytes()).hexdigest()==m['cinderLibrarySha256']
source.mkdir(parents=True)
archive=subprocess.check_output(['git','-C',a.gelbox,'archive',m['baseCommit'],'src','include','assets'])
with tarfile.open(fileobj=io.BytesIO(archive)) as t:t.extractall(source,filter='data')
subprocess.run(['git','apply',str(r/'compatibility.patch')],cwd=source,check=True)
shutil.copytree(r/'additions',source,dirs_exist_ok=True)
for name,digest in m['sourceHashes'].items():assert hashlib.sha256((source/name).read_bytes()).hexdigest()==digest,name
subprocess.run(['cmake','-S',str(source/'proj/cmake'),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release',f'-DCINDER_PATH={pathlib.Path(a.cinder).resolve()}'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
print(out/'build/Gelbox.app')
