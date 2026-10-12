"""Evaluate completed two-hour reports; partial observations can never pass."""
import argparse,json,math,re
from pathlib import Path

HERE=Path(__file__).resolve().parent
BACKENDS={'chromium-webgpu','chromium-webgl2'}

def require(condition,message):
 if not condition:raise ValueError(message)
def finite(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
def size_mib(text,label):
 match=re.search(re.escape(label)+r':\s*([\d.]+)([BKMG])\b',text)
 require(match is not None,f'Missing {label}')
 value=float(match[1])*{'B':1/1024**2,'K':1/1024,'M':1,'G':1024}[match[2]]
 require(finite(value) and value>0,f'Invalid {label}')
 return value

def verify(root,budget):
 paths=list(Path(root).glob('*/resource-lifecycle.json'))
 require(len(paths)==2,'Need two completed backend reports')
 results=[];seen=set()
 for path in paths:
  report=json.loads(path.read_text());backend=report['backend']
  require(backend in BACKENDS and backend not in seen,'Wrong or duplicate backend');seen.add(backend)
  require(report['cycles']==budget['cycles'] and report['holdMs']==budget['holdMs'],'Wrong workload/duration configuration')
  baseline=report['baseline'];require(finite(baseline) and baseline>0,'Invalid resource baseline')
  require(len(report['closedCycleCounts'])==budget['cycles'],'Incomplete cycles')
  require(all(x==baseline for x in report['closedCycleCounts']),'Owned resources grew')
  require(len(report['peaks'])==budget['cycles'] and all(finite(x) and x>baseline for x in report['peaks']),'Missing populated-view resources')
  require(report['afterRouteUnmount']==0,'Resources retained after route exit')
  require(not list(path.parent.glob('*-error.txt')),'Memory capture error')
  expected=[0,*range(10,budget['cycles']+1,10),budget['cycles']+.5,budget['cycles']+1]
  for key in ['memory','residentMemory']:
   require([r['cycle'] for r in report[key]]==expected,f'Incomplete or duplicate {key} checkpoints')
  resident={r['cycle']:r for r in report['residentMemory']}
  elapsed=resident[budget['cycles']]['elapsedMs']-resident[0]['elapsedMs']
  require(finite(elapsed) and elapsed>=budget['sessionSeconds']*1000,'Session too short')
  for r in resident.values():
   require(r['processes'] and all(finite(p['rssKiB']) and p['rssKiB']>0 for p in r['processes']),'Missing RSS sample')
  memory={r['cycle']:r for r in report['memory']};heap0=memory[10]['usedSize'];dom0=memory[10]['dom']
  require(finite(heap0),'Invalid initial heap')
  max_heap_growth=0
  for cycle in range(10,budget['cycles']+1,10):
   sample=memory[cycle];require(finite(sample['usedSize']),'Invalid retained heap')
   growth=sample['usedSize']-heap0;max_heap_growth=max(max_heap_growth,growth)
   require(growth<=budget['maximumRetainedHeapGrowthAfterCycle10Bytes'],'Retained heap budget exceeded')
   for key in ['documents','nodes','jsEventListeners']:
    require(finite(sample['dom'][key]) and sample['dom'][key]<=dom0[key]+budget['maximumDomGrowthAfterCycle10'],'DOM budget exceeded')
  footprints={};pids={}
  for file in path.parent.glob('vmmap-*.txt'):
   match=re.fullmatch(r'vmmap-(0|10|60|120)-(renderer|GPU)-(\d+)\.txt',file.name)
   require(match is not None,'Unexpected footprint file')
   cycle,kind,pid=int(match[1]),match[2],int(match[3]);key=(cycle,kind)
   require(key not in footprints,'Duplicate footprint checkpoint')
   require(kind not in pids or pids[kind]==pid,'Process restarted during session');pids[kind]=pid
   require(any(p['pid']==pid and p['type']==kind for p in resident[cycle]['processes']),'Footprint PID differs from observed process')
   text=file.read_text();footprint=size_mib(text,'Physical footprint');peak=size_mib(text,'Physical footprint (peak)')
   require(peak>=footprint and peak<=budget['physicalFootprintPeakMiB'][kind],'Peak physical footprint budget exceeded')
   footprints[key]={'cycle':cycle,'process':kind,'footprintMiB':footprint,'peakMiB':peak}
  require(set(footprints)=={(c,k) for c in [0,10,60,120] for k in ['renderer','GPU']},'Missing footprint checkpoints')
  for kind in ['renderer','GPU']:
   for cycle in [60,120]:
    require(footprints[cycle,kind]['footprintMiB']-footprints[10,kind]['footprintMiB']<=budget['maximumClosedFootprintGrowthAfterCycle10MiB'],'Retained physical footprint budget exceeded')
  results.append({'backend':backend,'elapsedSeconds':elapsed/1000,'maxRetainedHeapGrowthBytes':max_heap_growth,'footprints':list(footprints.values())})
 require(seen==BACKENDS,'Missing backend')
 return {'passed':True,'budget':budget,'results':results}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('run');args=parser.parse_args()
 try:result=verify(args.run,json.loads((HERE/'budget.json').read_text()))
 except (ValueError,KeyError,TypeError) as error:raise SystemExit(f'NOT VERIFIED: {error}')
 print(json.dumps(result,indent=2))
