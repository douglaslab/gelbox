"""Check an attribution run; process exit alone is not a passing capture."""
from pathlib import Path
import argparse,json
p=argparse.ArgumentParser();p.add_argument('run',type=Path);p.add_argument('--expect-injected-failure',action='store_true');a=p.parse_args()
rows=[json.loads(line) for line in (a.run/'events.jsonl').read_text().splitlines()]
watched={r['detail']:r['view'] for r in rows if r['kind']=='watch'}
assert set(watched)=={'sample','loupe-0','loupe-1','loupe-2'} and len(set(watched.values()))==4
external=[r for r in rows if r['origin']=='external' and r['kind'] in ['mouseDown','mouseUp','mouseDrag','keyDown','keyUp']]
if a.expect_injected_failure:
 failure=json.loads((a.run/'failure.json').read_text());assert failure['error']=='Missing workload view'
 assert not (a.run/'performance.json').exists()
 injected=[r for r in rows if r['kind']=='injected-close'];assert len(injected)==1 and injected[0]['view']==watched['sample']
 detached=[r for r in rows if r['kind']=='detach' and r['view']==watched['sample']];assert len(detached)==1
 assert detached[0]['origin']=='fault-injection' and detached[0]['tick']==injected[0]['tick']<failure['tick']
 assert 'SampleView' in detached[0]['detail'] and 'close' in detached[0]['detail']
 assert (a.run/'failed-workload.png').is_file() and (a.run/'failed-interaction.json').is_file()
 summary={'result':'expected failure detected','removed':'sample','removed_tick':detached[0]['tick'],'guard_tick':failure['tick']}
else:
 assert not (a.run/'failure.json').exists()
 report=json.loads((a.run/'performance.json').read_text())
 completed=[r for r in rows if r['kind']=='completed'];assert len(completed)==1
 assert not [r for r in rows if r['kind']=='detach' and r['view'] in watched.values() and r['tick']<=completed[0]['tick']]
 assert not [r for r in rows if r['kind'] in ['failure','injected-close']]
 assert len(report['interaction'])==63 and abs(report['interaction'][30]['time']-.1)<.005
 assert abs(report['interaction'][-1]['time']-1)<.0001
 counts=[s['resources'] for s in report['snapshots']];assert len(counts)>=2 and all(c==counts[0] for c in counts)
 assert all(len(s['particles'])==4 and all(n>0 for n in s['particles']) for s in report['snapshots'])
 summary={'result':'complete capture','snapshots':len(counts),'resources':counts[0],'completion_tick':completed[0]['tick']}
summary['external_mutating_events']=external
print(json.dumps(summary,indent=2))
