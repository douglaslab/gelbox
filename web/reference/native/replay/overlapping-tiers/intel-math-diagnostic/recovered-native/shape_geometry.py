"""Original geometry instructions with measured Intel powers, finite input set."""
import importlib.util,json,pathlib
root=pathlib.Path.cwd();here=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('original_geometry',root/'reference/native/replay/overlapping-tiers/emulated-diagnostic/probe.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
g=m.Geometry()
powers=json.loads((here/'shape-powers.json').read_text())
table={(p['base'],p['exponent']):p['result'] for p in powers}
assert len(table)==len(powers)==12
assert all(p['image']=='/usr/lib/system/libsystem_m.dylib' and p['symbolOffset']==94432 for p in powers)
def measured_power(base,exponent):
 # Missing input is an error; no fallback to host math or product code.
 return table[(base,exponent)]
g.pow=measured_power
shapes=json.loads((root/'reference/native/replay/overlapping-tiers/emulated-diagnostic/shape-grid.json').read_text())
result=[]
for c in shapes:
 rect=g.run(c['bases'],1,c['aspect'],c['ctx'],c['wellRect'],1,1)
 result.append({**c,'rect':rect,'powCalls':g.pow_calls})
print(json.dumps(result,indent=2))
