import importlib.util,json,pathlib
root=pathlib.Path.cwd()
spec=importlib.util.spec_from_file_location('probe',root/'reference/native/replay/overlapping-tiers/emulated-diagnostic/probe.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
g=m.Geometry();c=json.loads((root/'reference/native/numerical/cases.json').read_text())[0];result=[]
for aspect in [1.2,3.7,15.3]:
 for time in [.1,.37]:
  for voltage in [-70,83]:
   for bases in [1234,3001]:
    ctx={**c['ctx'],'time':time,'voltage':voltage};rect=g.run(bases,1,aspect,ctx,c['wellRect'],1,1)
    result.append({'id':f'a{aspect}-t{time}-v{voltage}-bp{bases}','bases':bases,'aspect':aspect,'ctx':ctx,'wellRect':c['wellRect'],'rect':rect,'powCalls':g.pow_calls})
print(json.dumps(result,indent=2))
