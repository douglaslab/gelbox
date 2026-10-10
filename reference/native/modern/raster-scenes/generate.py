"""Generate explicit scene inputs and a native-only export helper (no renderer logic)."""
from pathlib import Path
import copy,json
root=Path(__file__).resolve().parent
base=dict(rect=dict(x1=15.25,y1=49.5,x2=78.75,y2=54),smearAbove=0,smearBelow=0,smearBrightnessAbove=[.6,0],smearBrightnessBelow=[.6,0],flameHeight=0,smileHeight=0,smileExp=1.7,blur=0,brightness=.6,color=[1,1,1],randSeed=42,wellDamage=0,wellDamageRandSeed=73,mass=50,aggregate=1,degrade=0)
cases=[]
for ppu in (1,2):
 for mode in ('plain','blur','smile','damage','smear','flames','water','combined'):
  b=copy.deepcopy(base)
  if mode in ('blur','combined'):b['blur']=5
  if mode in ('smile','combined'):b['smileHeight']=8
  if mode in ('damage','combined'):b['wellDamage']=.7
  if mode in ('smear','flames','combined'):b.update(smearAbove=8,smearBelow=16)
  if mode in ('flames','combined'):b['flameHeight']=5
  cases.append(dict(id=f'{mode}-{ppu}',width=96,height=128,ppu=ppu,bands=[b],globalWarp=dict(h2oDistort=mode in ('water','combined'),randSeed=42)))
(root/'cases.json').write_text(json.dumps(cases,indent=2)+'\n')
lines=['#pragma once','#include "GelRender.h"','#include "cinder/ImageIo.h"','inline void captureRasterScenes() {','static std::vector<std::shared_ptr<GelRender>> retained;']
for c in cases:
 lines+=['{ auto renderer=std::make_shared<GelRender>();',f'renderer->setup(glm::ivec2({c["width"]},{c["height"]}),{c["ppu"]});','std::vector<Band> bands;']
 for b in c['bands']:
  r=b['rect'];lines+=['{ Band b;',f'b.mRect=ci::Rectf({r["x1"]},{r["y1"]},{r["x2"]},{r["y2"]});']
  for k in ('smearAbove','smearBelow','flameHeight','smileHeight','smileExp','blur','brightness','randSeed','wellDamage','wellDamageRandSeed'):
   lines.append(f'b.m{k[0].upper()+k[1:]}={b[k]};')
  for k in ('smearBrightnessAbove','smearBrightnessBelow'):
   for i,v in enumerate(b[k]):lines.append(f'b.m{k[0].upper()+k[1:]}[{i}]={v};')
  lines+=['b.mColor=ci::Color('+','.join(map(str,b['color']))+');','bands.push_back(b); }']
 g=c['globalWarp'];lines+=['renderer->setBands(bands);','GelRender::GlobalWarp warp;',f'warp.mH2ODistort={str(g["h2oDistort"]).lower()};warp.mRandSeed={g["randSeed"]};','renderer->setGlobalWarp(warp);renderer->render();',f'ci::writeImage(ci::fs::path("/tmp/gel-native-lossless-probe/raster-scenes/{c["id"]}.png"),renderer->getOutput()->createSource());','retained.push_back(renderer); }']
lines+=['}'];(root/'RasterProbe.h').write_text('\n'.join(lines)+'\n')
