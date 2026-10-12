"""Find observable solver boundaries distinguishing two pow hooks; diagnostic only."""
import importlib.util,json,pathlib,math,struct
root=pathlib.Path.cwd();spec=importlib.util.spec_from_file_location('geometry_probe',root/'reference/native/replay/overlapping-tiers/emulated-diagnostic/probe.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
a=m.Geometry();b=m.Geometry();b.pow=lambda x,y:m.f(math.pow(x,y))
c=json.loads((root/'reference/native/numerical/cases.json').read_text())[0]
c['ctx']['time']=.37;c['sample']['fragments'][c['fragment']]['aspectRatio']=1.2
f=m.f;lane=f(390/7);h=f(lane*f(.1));y=f(20-f(h/2));c['wellRect']={'x1':f(lane*.25),'x2':f(f(lane*.25)+f(lane*.5)),'y1':y,'y2':f(y+h)}
ctx=c['ctx'];w=c['wellRect'];results=[]
# Positive voltages within the ordinary control range; original power inputs
# stay fixed while voltage moves the differing rectangle edge onto integer Y.
for target in range(60,171):
 v=(target-y+f(f(h*f(.37))*f(.25)))*70/(f(.37)*f(ctx['ySpaceScale'])*f(f(.05)+f(math.pow(f(.7859917879104614),f(3.7)))))
 bits=struct.unpack('<I',struct.pack('<f',v))[0]
 for off in range(-6,7):
  ctx['voltage']=struct.unpack('<f',struct.pack('<I',bits+off))[0]
  ra=a.run(3001,1,1.2,ctx,w,1,1);rb=b.run(3001,1,1.2,ctx,w,1,1)
  if int(ra[1])==int(rb[1]):continue
  sa=a.solve(c,target,1);sb=b.solve(c,target,1)
  if sa==sb:continue
  initial=a.run(4001,1,1.2,ctx,w,1,1);initial_b=b.run(4001,1,1.2,ctx,w,1,1)
  delta=target-int(initial[1])
  if int(f(initial[1]+delta))!=target or int(f(initial_b[1]+delta))!=target:continue
  results.append({'target':target,'voltage':ctx['voltage'],'time':.37,'aspect':1.2,'armPowfBases':sa,'roundedDoublePowBases':sb,'armRect':ra,'roundedDoubleRect':rb,'initialRect':initial,'initialRoundedDoubleRect':initial_b,'dragDelta':delta})
  break
 if len(results)==3:break
print(json.dumps({'diagnosticOnly':True,'cases':results},indent=2))
