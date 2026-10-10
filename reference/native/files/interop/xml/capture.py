"""Capture only safe, explicit XML samples with the pinned native constructor."""
from pathlib import Path
import subprocess,json,hashlib
root=Path(__file__).resolve().parent
records=[]
for path in sorted(root.glob('*.xml')):
 command=['/tmp/gel-native-file-interop/build/gel-file-interop',str(path)]
 one=subprocess.run(command,capture_output=True,check=True);two=subprocess.run(command,capture_output=True,check=True)
 assert one.stdout==two.stdout and one.stderr==two.stderr
 output=path.with_suffix('.native.json');output.write_text(json.dumps(json.loads(one.stdout),ensure_ascii=False,indent=2)+'\n')
 records.append({'input':path.name,'inputSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'output':output.name,'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'stderr':one.stderr.decode(),'repeatedIdentically':True})
(root/'captures.json').write_text(json.dumps(records,indent=2)+'\n')
