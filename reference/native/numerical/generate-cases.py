#!/usr/bin/env python3
"""Deterministic input matrix; no TS or native simulation code runs here."""
import json,copy,pathlib,itertools
root=pathlib.Path(__file__).resolve().parent
buffers={'TBE':dict(tris=44.5,borate=44.5,acetate=0,edta=1),'TAE':dict(tris=40,borate=0,acetate=20,edta=1),'H2O':dict(tris=0,borate=0,acetate=0,edta=0)}
base=dict(id='',sample=dict(buffer=buffers['TBE'],fragments=[dict(bases=3001,mass=125,degrade=0,dye=-1,aspectRatio=1,aggregate=[1],color=[.2,.4,.8])]),ctx=dict(voltage=70,time=1,ySpaceScale=468.85714285714283,wellDamage=0,gelBuffer=buffers['TBE'],sampleBuffer=buffers['TBE']),wellRect=dict(x1=13.928571428571429,y1=17.214285714285715,x2=41.785714285714285,y2=22.785714285714285),lane=0,fragment=0)
cases=[]
for buffer,voltage,time,degrade in itertools.product(buffers,[-300,0,70,300],[0,.25,1],[0,.5,1,1.5,2]):
 c=copy.deepcopy(base);c['id']=f'{buffer}-V{voltage}-t{time}-d{degrade}';c['ctx'].update(gelBuffer=buffers[buffer],voltage=voltage,time=time);c['sample']['fragments'][0]['degrade']=degrade;cases.append(c)
for key,values in {'bases':[0,1,100,1500,10000,14000,20000],'mass':[0,1,140,175,250],'aspectRatio':[1,4,16],'aggregate':[[],[0,0],[0,1],[1,2,3],[0,0,0,0,0,0,1]]}.items():
 for i,v in enumerate(values):
  c=copy.deepcopy(base);c['id']=f'{key}-{i}';c['sample']['fragments'][0][key]=v;cases.append(c)
for dye,mass,buffer in itertools.product(range(4),[0,62.5,125],buffers):
 c=copy.deepcopy(base);c['id']=f'dye{dye}-mass{mass}-{buffer}';c['ctx']['gelBuffer']=buffers[buffer];c['sample']['fragments'][0].update(dye=dye,mass=mass);cases.append(c)
for damage in [.25,.5,1]:
 c=copy.deepcopy(base);c['id']=f'damage-{damage}';c['ctx']['wellDamage']=damage;cases.append(c)
# Second lane/index and non-TBE sample buffer exercise references and disabled buffer experiment.
c=copy.deepcopy(base);c['id']='lane-index-sample-buffer';c['lane']=3;c['fragment']=1;c['sample']['fragments'].append(copy.deepcopy(c['sample']['fragments'][0]));c['ctx']['sampleBuffer']=buffers['H2O'];c['sample']['buffer']=buffers['H2O'];cases.append(c)
for bases,degrade in [(90,.7),(90,1.7),(100,.29),(3001,.1),(3001,1.1)]:
 c=copy.deepcopy(base);c['id']=f'fractional-bp{bases}-d{degrade}';c['sample']['fragments'][0].update(bases=bases,degrade=degrade);cases.append(c)
for voltage,time in [(70,.6),(210,1),(140,.9)]:
 c=copy.deepcopy(base);c['id']=f'diffusion-bp1000-V{voltage}-t{time}';c['sample']['fragments'][0]['bases']=1000;c['ctx'].update(voltage=voltage,time=time);cases.append(c)
native=json.loads((root.parent/'files/ladder-after-selection.gel.json').read_text())['Gel']['Samples'][0]
for i,f in enumerate(native['Fragments']):
 c=copy.deepcopy(base);c['id']=f'startup-fragment-{i}';c['sample']['fragments']=[dict(bases=f['Bases'],mass=f['Mass'],degrade=f['Degrade'],dye=-1,aspectRatio=f['AspectRatio'],aggregate=f['Aggregate'],color=f['Color'])];cases.append(c)
c=copy.deepcopy(base);c['id']='tied-aggregate-tops';c['sample']['fragments'][0].update(bases=14000,aggregate=[1,1,1]);cases.append(c)
c=copy.deepcopy(base);c['id']='overloaded-H2O';c['sample']['fragments'][0]['mass']=175;c['ctx']['gelBuffer']=buffers['H2O'];cases.append(c)
c=copy.deepcopy(base);c['id']='loupe-degraded-multimer';c['sample']['fragments'][0].update(aggregate=[1,2,3],degrade=1.5);cases.append(c)
c=copy.deepcopy(next(c for c in cases if c['id']=='lane-index-sample-buffer'));c['id']='loupe-source-index';c['sample']['fragments'][1]['degrade']=1.2;cases.append(c)
c=copy.deepcopy(base);c['id']='loupe-degrade-boundary';c['sample']['fragments'][0]['degrade']=.50000001;cases.append(c)
for c in cases:
 tiers=[i+1 for i,w in enumerate(c['sample']['fragments'][c['fragment']]['aggregate']) if w>0] or [1]
 c['solverTargets']=[dict(targetY=y,aggregate=tier) for tier in sorted(set(tiers+[2])) for y in [-200,0,75.9,250,600]]
# Choose times that put native search guesses near an integer pixel boundary.
# This independent double-precision construction selects inputs, never expected results.
for bp in range(1,14000,1000):
 for target in range(30,400,7):
  c=copy.deepcopy(base);c['id']=f'boundary-bp{bp}-y{target}'
  height=c['wellRect']['y2']-c['wellRect']['y1']
  k=(.05+(1-max(0,(bp-1)/14000))**3.7)*c['ctx']['ySpaceScale']-height*.25
  c['ctx']['time']=(target-c['wellRect']['y1'])/k
  if not 0<=c['ctx']['time']<=1: continue
  c['solverTargets']=[dict(targetY=target,aggregate=1)];cases.append(c)
for c in cases:
 if c['id'] in ['loupe-degrade-boundary','loupe-degraded-multimer','loupe-source-index','aggregate-3','lane-index-sample-buffer','overloaded-H2O','bases-0','mass-0'] or c['id'].startswith(('TBE-V70-t1-','TAE-V70-t1-','H2O-V70-t1-','dye0-mass62.5')):
  c['loupeProbes']=True
(root/'cases.json').write_text(json.dumps(cases,indent=2)+'\n');print(len(cases),'cases')
