"""Check actual native Gel fields after reading the retained web UI downloads."""
from pathlib import Path
import json,subprocess,hashlib,struct
root=Path(__file__).resolve().parent
binary='/tmp/gel-native-file-interop/build/gel-file-interop'
def native_numbers(value,key=''):
    if isinstance(value,dict):
        return {k:native_numbers(v,k) for k,v in value.items()}
    if isinstance(value,list):
        return [native_numbers(v,key) for v in value]
    if isinstance(value,(int,float)) and key not in ('id','Bases','visibleLanes'):
        # Real JSON tokens pass through default stream precision 6; integer
        # tokens retain their decimal text. Both are then read as native floats.
        number=float(format(value,'.6g')) if isinstance(value,float) else value
        return struct.unpack('f',struct.pack('f',number))[0]
    return value
records=[]
for backend in ['webgpu','webgl2']:
    source=root/f'{backend}-edited.json'
    web=json.loads(source.read_text())['Gel']
    command=[binary,str(source),'--gel-state']
    one=subprocess.run(command,capture_output=True,check=True)
    two=subprocess.run(command,capture_output=True,check=True)
    assert one.stdout==two.stdout and one.stderr==two.stderr
    actual=json.loads(one.stdout)
    expected=native_numbers({'visibleLanes':len(web['Samples']),'samples':web['Samples'],
        'buffer':web['Buffer'],'time':web['Time'],'voltage':web['Voltage'],'wellDamage':web['WellDamage']})
    assert actual==expected,(actual,expected)
    target=root/f'{backend}-native-reread-state.json'
    target.write_text(json.dumps(actual,ensure_ascii=False,indent=2)+'\n')
    records.append({'backend':backend,'webExportSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'nativeStateSha256':hashlib.sha256(target.read_bytes()).hexdigest(),
        'allFieldsExactlyNativeJsonConversion':True,'repeatIdentical':True,
        'webEditedMass':web['Samples'][0]['Fragments'][0]['Mass'],
        'nativeLoadedMass':actual['samples'][0]['Fragments'][0]['Mass']})
(root/'roundtrip-results.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps(records,indent=2))
