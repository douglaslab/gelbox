#!/usr/bin/env python3
import copy,json,pathlib
r=pathlib.Path(__file__).resolve().parent
cases=json.loads((r/'cases.json').read_text());out=[]
ids=['startup-fragment-0','startup-fragment-5','mass-0','mass-1','mass-4','aspectRatio-2','aggregate-2','aggregate-3','aggregate-4','aggregate-degraded-first-max','loupe-degraded-multimer','loupe-source-index','TBE-V70-t1-d2','dye0-mass125-TBE']
for i,id in enumerate(ids):
 c=next(c for c in cases if c['id']==id)
 for mode in ['spawn','lifecycle']:
  scenario=dict(id=f'{id}-{mode}',sample=c['sample'],seed=[1,42,2147483648,4294967295][i%4],globalSeed=310+i,bounds=dict(x1=10,y1=20,x2=410,y2=420))
  if mode=='spawn':scenario['steps']=[dict(spawn=[c['fragment']]*4)]
  else:
   edited=copy.deepcopy(c['sample'])
   for f in edited['fragments']:f['mass']=0
   scenario['steps']=[dict(ticks=1),dict(ticks=9),dict(ticks=50,bulletTime=True),dict(ticks=40),dict(sample=edited,ticks=1),dict(ticks=20)]
  out.append(scenario)
# Bounds/density and scaled-time transitions, plus native preroll.
sample=next(c for c in cases if c['id']=='startup-fragment-0')['sample']
for density in [0.01,0.5,2]:
 out.append(dict(id=f'density-{density}',sample=sample,seed=73,globalSeed=9,bounds=dict(x1=0,y1=0,x2=171,y2=171),steps=[dict(popDensityScale=density,ticks=20),dict(timeScale=2,bulletTime=True,ticks=10),dict(preroll=True),dict(bounds=dict(x1=0,y1=0,x2=20,y2=20),ticks=30)]))
# Native Rectf rounds endpoints before subtracting translated bounds.
fractional=copy.deepcopy(sample)
fractional['fragments'][0]['mass']=1000
fractional['fragments'][0]['aggregate']=[]
bounds=dict(x1=96.05,y1=0,x2=256.05,y2=400)
for mode in ['constructor','set-bounds']:
 out.append(dict(id=f'fractional-bounds-{mode}',sample=fractional,seed=1,globalSeed=310,bounds=bounds if mode=='constructor' else dict(x1=0,y1=0,x2=400,y2=400),steps=[dict(ticks=20)] if mode=='constructor' else [dict(bounds=bounds,ticks=20)]))
# Controlled picking covers transforms separately from stochastic spawning.
import math
for name,rx,ry,angle,multi in [
 ('small-monomer',1,2,0,[(0,0,0)]),
 ('ellipse',14,3,0.7,[(0,0,0)]),
 ('rotated-multimer',12,4,math.pi/2,[(0,0,0),(1,0,0.4),(-1,1,-0.3)]),
 ('minimum-radius-multimer',1,2,1.2,[(0,0,0),(1,0,0.4),(-1,1,-0.3)]),
 ('unrotated-multimer',12,4,0,[(0,0,0),(1,0,0.4)])]:
 part=dict(fragment=0,loc=dict(x=40,y=40),vel=dict(x=0,y=0),radius=dict(x=rx,y=ry),angle=angle,angleVel=0,color=[1,0,0],age=0,fade=1,alive=True,degradeKey=0,wholeness=.1,multi=[dict(loc=dict(x=x,y=y),angle=a) for x,y,a in multi])
 points=[[x+.125,y+.25] for x in range(15,66) for y in range(15,66)]
 # Half-degree boundary probes expose inverse-matrix rounding differences.
 prx,pry=max(rx,8),max(ry,8)
 for mx,my,ma in multi:
  ox,oy=mx*min(prx,pry)*2,my*min(prx,pry)*2
  cx=40+math.cos(angle)*ox-math.sin(angle)*oy
  cy=40+math.sin(angle)*ox+math.cos(angle)*oy
  for n in range(720):
   phase=n*math.pi/360
   ex,ey=prx*math.cos(phase),pry*math.sin(phase)
   points.append([cx+math.cos(angle+ma)*ex-math.sin(angle+ma)*ey,cy+math.sin(angle+ma)*ex+math.cos(angle+ma)*ey])
 parts=[part]
 steps=[dict(parts=copy.deepcopy(parts),picks=points)]
 # Native includes fading/dead particles and returns the last overlapping slot.
 front=copy.deepcopy(part);front.update(fragment=1,fade=0,alive=False)
 steps.append(dict(parts=[part,front],picks=points))
 out.append(dict(id=f'pick-{name}',sample=sample,seed=1,globalSeed=310,bounds=dict(x1=0,y1=0,x2=100,y2=100),steps=steps))
(r/'particle-cases.json').write_text(json.dumps(out,indent=2)+'\n');print(len(out),'particle scenarios')
