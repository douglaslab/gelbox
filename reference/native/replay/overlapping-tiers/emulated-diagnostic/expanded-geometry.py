import importlib.util,json,pathlib
root=pathlib.Path.cwd()
spec=importlib.util.spec_from_file_location('probe',root/'reference/native/replay/overlapping-tiers/emulated-diagnostic/probe.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
g=m.Geometry();f=m.f
cases=json.loads((root/'reference/native/numerical/cases.json').read_text()); outputs=json.loads((root/'reference/native/numerical/outputs.json').read_text()); results=[]
for c,output in zip(cases,outputs):
 frag=c['sample']['fragments'][c['fragment']];dye=frag['dye']>=0
 for band in output['bands']:
  bases=[6000,700,300,50][frag['dye']] if dye else frag['bases'];d=f(frag['degrade'])
  lo=0 if dye else max(1,int(f(min(1,d)*f(bases))))
  hi=0 if dye else max(1,int(f((min(1,f(d-1)) if d>1 else 0)*f(bases))))
  rect=g.run(bases,band['aggregate'],1 if dye else frag['aspectRatio'],c['ctx'],c['wellRect'],lo,hi,3 if dye else 1.5)
  results.append({'id':c['id'],'aggregate':band['aggregate'],'degradeLo':lo,'degradeHi':hi,'rect':rect,'powCalls':g.pow_calls})
print(json.dumps(results,indent=2))
