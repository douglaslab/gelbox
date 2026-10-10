"""Capture native Cinder/Quartz decoded bytes without a window or GL context."""
from pathlib import Path
import argparse,hashlib,json,subprocess,platform
parser=argparse.ArgumentParser();parser.add_argument('--cinder',type=Path,required=True);parser.add_argument('--build-dir',type=Path,required=True);args=parser.parse_args()
root=Path(__file__).resolve().parent;build=args.build_dir.resolve();cinder=args.cinder.resolve()
subprocess.run(['cmake','-S',str(root),'-B',str(build),f'-DCINDER_PATH={cinder}'],check=True)
subprocess.run(['cmake','--build',str(build),'-j','4'],check=True)
(root/'decoded').mkdir(exist_ok=True);records=[]
for source in sorted((root/'inputs').iterdir()):
 output=root/'decoded'/(source.name+'.rgba')
 result=json.loads(subprocess.check_output([str(build/'gel-image-decoder'),str(source),str(output)]))
 assert len(output.read_bytes())==result['width']*result['height']*4
 result.update(file=source.name,input_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),rgba_sha256=hashlib.sha256(output.read_bytes()).hexdigest());records.append(result)
(root/'native.json').write_text(json.dumps(records,indent=2)+'\n')
(root/'provenance.json').write_text(json.dumps({'cinder':subprocess.check_output(['git','-C',str(cinder),'rev-parse','HEAD'],text=True).strip(),'macos':platform.mac_ver()[0],'architecture':platform.machine(),'driver_sha256':hashlib.sha256((root/'driver.cpp').read_bytes()).hexdigest()},indent=2)+'\n')
