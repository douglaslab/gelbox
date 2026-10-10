"""Record native acceptance/rejection using the existing Cinder/Quartz driver."""
from pathlib import Path
import argparse,hashlib,json,platform,subprocess
parser=argparse.ArgumentParser();parser.add_argument('--decoder',type=Path,required=True);args=parser.parse_args()
root=Path(__file__).resolve().parent;decoder=args.decoder.resolve();output=root/'decoded';output.mkdir(exist_ok=True)
records=[]
for source in sorted((root/'inputs').glob('*.jpg')):
 target=output/(source.name+'.rgba');target.unlink(missing_ok=True)
 r=subprocess.run([str(decoder),str(source),str(target)],capture_output=True,text=True)
 record={'file':source.name,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'input_sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
 if r.returncode==0:
  dimensions=json.loads(r.stdout);assert len(target.read_bytes())==dimensions['width']*dimensions['height']*4
  record['rgba_sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
 else:assert not target.exists()
 records.append(record)
(root/'native-results.json').write_text(json.dumps(records,indent=2)+'\n')
(root/'provenance.json').write_text(json.dumps({'macos':platform.mac_ver()[0],'architecture':platform.machine(),'decoder_sha256':hashlib.sha256(decoder.read_bytes()).hexdigest(),'driver_sha256':hashlib.sha256((root.parent/'driver.cpp').read_bytes()).hexdigest()},indent=2)+'\n')
