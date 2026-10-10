#!/usr/bin/env python3
import copy,json,pathlib
r=pathlib.Path(__file__).resolve().parent
base=dict(fragment=0,loc=dict(x=100,y=100),vel=dict(x=0,y=0),radius=dict(x=10,y=6),angle=0,angleVel=0,color=[.2,.4,.6],age=0,fade=.65,alive=True,degradeKey=.37,wholeness=1,multi=[dict(loc=dict(x=0,y=0),angle=0)])
out=[]
for whole in [0,.01,.1,.25,.5,.7071067811865476,.9,.9999,1]:
 for selected,rollover in [(False,False),(True,False),(False,True),(True,True)]:
  p=copy.deepcopy(base);p['wholeness']=whole
  out.append(dict(id=f'whole-{whole}-select-{selected}-hover-{rollover}',part=p,selected=selected,rollover=rollover))
for rx,ry in [(1,1),(25,3),(3,25)]:
 for whole in [0,.1,.5,1]:
  p=copy.deepcopy(base);p.update(radius=dict(x=rx,y=ry),angle=1.2,wholeness=whole,multi=[dict(loc=dict(x=0,y=0),angle=.3),dict(loc=dict(x=1,y=-.7),angle=-.4)])
  out.append(dict(id=f'multi-{rx}-{ry}-whole-{whole}',part=p,selected=True,rollover=False))
for rx,ry in [(1,1),(25,3)]:
 for whole in [.0001,.0002,.0003,.001]:
  for selected in [False,True]:
   p=copy.deepcopy(base);p.update(radius=dict(x=rx,y=ry),wholeness=whole)
   out.append(dict(id=f'narrow-{rx}-{ry}-whole-{whole}-select-{selected}',part=p,selected=selected,rollover=False))
(r/'mesh-cases.json').write_text(json.dumps(out,indent=2)+'\n');print(len(out),'mesh scenarios')
