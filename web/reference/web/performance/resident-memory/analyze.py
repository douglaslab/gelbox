"""Summarize macOS browser RSS separately from explicit GPU object counts."""
import argparse,json,statistics
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('reports',nargs='+',type=Path);args=p.parse_args()
results=[]
for path in args.reports:
 report=json.loads(path.read_text());samples=[s for s in report['residentMemory'] if 0<=s['cycle']<=report['cycles']]
 assert report['cycles']>=200 and len(samples)>=21,'Need at least 200 cycles for distinct early/late windows'
 assert all(s['processes'] and all(p['rssKiB'] is not None for p in s['processes']) for s in samples)
 metrics={}
 for kind in ['total','browser','GPU','renderer']:
  points=[(s['cycle'],s['totalRssKiB'] if kind=='total' else sum(p['rssKiB'] for p in s['processes'] if p['type']==kind)) for s in samples]
  if kind!='total':assert any(y>0 for _,y in points),f'Missing {kind} samples'
  early=[v for c,v in points if 50<=c<=100]
  late=[v for c,v in points if report['cycles']-50<=c<=report['cycles']]
  tail=[(c,v) for c,v in points if c>=report['cycles']//2]
  x=statistics.mean(c for c,_ in tail);y=statistics.mean(v for _,v in tail)
  slope=sum((c-x)*(v-y) for c,v in tail)/sum((c-x)**2 for c,v in tail)
  metrics[kind]={'initialMiB':points[0][1]/1024,'finalMiB':points[-1][1]/1024,'peakMiB':max(v for _,v in points)/1024,'medianCycles50to100MiB':statistics.median(early)/1024,'medianLast50CyclesMiB':statistics.median(late)/1024,'medianGrowthMiB':(statistics.median(late)-statistics.median(early))/1024,'lastHalfSlopeKiBPerCycle':slope}
 results.append({'backend':report['backend'],'browser':report['browser'],'cycles':report['cycles'],'elapsedMs':report['elapsedMs'],'samples':len(samples),'closedObjects':report['baseline'],'peakObjects':max(report['peaks']),'afterRouteUnmount':report['afterRouteUnmount'],'metrics':metrics})
print(json.dumps(results,indent=2))
