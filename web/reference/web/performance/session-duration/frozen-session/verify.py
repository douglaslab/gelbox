"""Require convergent frozen sampling, then apply the unchanged session budget."""
import argparse, importlib.util, json, math
from pathlib import Path

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('original_session_verify',HERE.parent/'verify.py')
original=importlib.util.module_from_spec(spec);spec.loader.exec_module(original)
require=original.require

def validate_sampling(report):
 require(report.get('measurementMode')=='frozen-convergent-v1','Wrong measurement method')
 cycles=report['cycles']
 expected=[0,*range(10,cycles+1,10),cycles+.5,cycles+1]
 checkpoints=report['frozenSamples']
 require([s['cycle'] for s in checkpoints]==expected,'Incomplete frozen checkpoints')
 require([s['cycle'] for s in report['memory']]==expected,'Incomplete reported heap checkpoints')
 for frozen,memory in zip(checkpoints,report['memory']):
  for key in ['frameBefore','frameAfter','resumeBaseline','resumedFrame']:
   require(original.finite(frozen[key]) and frozen[key]>=0,'Missing frame observation')
  require(frozen['frameBefore']==frozen['frameAfter'],'Animation did not stop')
  require(frozen['resumedFrame']>frozen['resumeBaseline']>=frozen['frameAfter'],'Animation did not resume')
  samples=frozen['samples']
  require(len(samples)==3 and [s['repeat'] for s in samples]==[1,2,3],'Missing repeated samples')
  for key in ['usedSize','backingStorageSize']:
   require(all(original.finite(s[key]) and s[key]>=0 for s in samples),'Invalid heap sample')
   require(len({s[key] for s in samples})==1,'Heap samples did not converge')
   require(memory[key]==samples[-1][key],'Reported heap is not the converged sample')
 return True

def verify(root,budget):
 paths=list(Path(root).glob('*/resource-lifecycle.json'))
 require(len(paths)==2,'Need two completed backend reports')
 for path in paths:validate_sampling(json.loads(path.read_text()))
 return original.verify(root,budget)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('run');args=parser.parse_args()
 try:result=verify(args.run,json.loads((HERE.parent/'budget.json').read_text()))
 except (ValueError,KeyError,TypeError) as error:raise SystemExit(f'NOT VERIFIED: {error}')
 print(json.dumps(result,indent=2))
