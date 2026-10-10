"""Regenerate native Sample::toJson fixtures from retained inputs."""
from pathlib import Path
import json,subprocess
root=Path(__file__).resolve().parent
for name in ['mixed','empty']:
 source=root/(name+'-input.json');command=['/tmp/gel-native-file-interop/build/gel-file-interop',str(source)]
 raw=subprocess.check_output(command);assert raw==subprocess.check_output(command)
 result=json.loads(raw)
 # The driver exercises Sample serialization; application file header is fixed.
 result['Gelbox']=json.loads(source.read_text())['Gelbox']
 (root/(name+'-native.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
