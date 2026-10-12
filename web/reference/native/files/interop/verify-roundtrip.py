"""Check retained web UI exports with the independently compiled native reader."""
from pathlib import Path
import json,subprocess,hashlib,struct
root=Path(__file__).resolve().parent
binary='/tmp/gel-native-file-interop/build/gel-file-interop'
records=[]
for backend in ['webgpu','webgl2']:
 target=root/(backend+'-edited.json')
 command=[binary,str(target)];raw=subprocess.check_output(command);assert raw==subprocess.check_output(command)
 native=json.loads(raw);web=json.loads(target.read_text())
 loaded=json.loads(subprocess.check_output(command+['--mass-values']))
 # Retained JsonTree::deserialize stores real values through ci::toString
 # (default stream precision 6), then getValue<float> parses that string.
 expected=[struct.unpack('f',struct.pack('f',float(format(f['Mass'],'.6g'))))[0] for f in web['Sample']['Fragments']]
 assert loaded==expected,(loaded,expected)
 # All other fixture fields are exactly representable; check them exactly.
 def without_mass(sample):
  return {**sample,'Fragments':[{k:v for k,v in f.items() if k!='Mass'} for f in sample['Fragments']]}
 assert without_mass(web['Sample'])==without_mass(native['Sample'])
 output=root/(backend+'-native-reread.json');output.write_text(json.dumps(native,ensure_ascii=False,indent=2)+'\n')
 records.append({'backend':backend,'webExportSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'nativeRereadSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'editedMass':web['Sample']['Fragments'][0]['Mass'],'loadedNativeMass':loaded[0],'nativeWriterMass':native['Sample']['Fragments'][0]['Mass'],'loadedMassesExactlyNativeJsonConversion':True,'allOtherFieldsExactlyPreserved':True,'repeatNativeOutputIdentical':True})
(root/'roundtrip-results.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps(records,indent=2))
