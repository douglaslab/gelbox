"""Independent Gel constructor/writer captures using the documented layout seed."""
from pathlib import Path
import json,subprocess,hashlib
root=Path(__file__).resolve().parent
mixed=json.loads((root.parent/'mixed-native.json').read_text())['Sample']
empty=json.loads((root.parent/'empty-native.json').read_text())['Sample']
cases={
 'mixed-twelve':[mixed,None,None,None,empty,None,None,None,None,None,None,{**mixed,'name':'Last lane','id':17}],
 'short':[None,mixed],
 'over-limit':[None]*20+[mixed,empty],
 'empty':[],
}
records=[]
for name,samples in cases.items():
 doc={'Gelbox':{'version':'1.0','type':'gel'},'Gel':{'Samples':samples,'Buffer':{'Tris':12.25,'Borate':0,'Acetate':8.5,'EDTA':.5},'Time':.625,'Voltage':83.5,'WellDamage':.125}}
 source=root/(name+'-input.json');source.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
 cmd=['/tmp/gel-native-file-interop/build/gel-file-interop',str(source)]
 one=subprocess.run(cmd,capture_output=True,check=True);two=subprocess.run(cmd,capture_output=True,check=True);assert one.stdout==two.stdout and one.stderr==two.stderr
 output=json.loads(one.stdout);output['Gelbox']=doc['Gelbox'];target=root/(name+'-native.json');target.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
 state_cmd=cmd+['--gel-state']
 state_one=subprocess.run(state_cmd,capture_output=True,check=True);state_two=subprocess.run(state_cmd,capture_output=True,check=True)
 assert state_one.stdout==state_two.stdout and state_one.stderr==state_two.stderr
 state=json.loads(state_one.stdout);state_target=root/(name+'-state.json');state_target.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
 records.append({'case':name,'stateSha256':hashlib.sha256(state_target.read_bytes()).hexdigest(),'visibleLanes':state['visibleLanes'],'retainedSlots':len(state['samples']),'writerSamplesKind':type(output['Gel']['Samples']).__name__,'inputSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'nativeSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'inputLanes':len(samples),'writerEntryCount':len(output['Gel']['Samples']),'repeatIdentical':True,'stderr':one.stderr.decode()})
(root/'captures.json').write_text(json.dumps(records,indent=2)+'\n')
print([(r['case'],r['inputLanes'],r['visibleLanes'],r['retainedSlots'],r['writerSamplesKind']) for r in records])
