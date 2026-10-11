"""Verifier rejection controls, using synthetic reports only (not release evidence)."""
import copy,json,tempfile,unittest
from pathlib import Path
from verify import verify,HERE

class VerificationControls(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.budget=json.loads((HERE/'budget.json').read_text())
  self.paths=[]
  for backend in ['chromium-webgpu','chromium-webgl2']:
   directory=self.root/backend;directory.mkdir();cycles=[0,*range(10,121,10),120.5,121]
   report={'backend':backend,'cycles':120,'holdMs':60000,'baseline':50,'closedCycleCounts':[50]*120,'peaks':[80]*120,'afterRouteUnmount':0,
    'memory':[{'cycle':c,'usedSize':1000000,'dom':{'documents':1,'nodes':150,'jsEventListeners':200}} for c in cycles],
    'residentMemory':[{'cycle':c,'elapsedMs':c*60000,'processes':[{'pid':1,'type':'renderer','rssKiB':100000},{'pid':2,'type':'GPU','rssKiB':500000}]} for c in cycles]}
   path=directory/'resource-lifecycle.json';path.write_text(json.dumps(report));self.paths.append(path)
   for c in [0,10,60,120]:
    for kind,pid,value,peak in [('renderer',1,'60M','150M'),('GPU',2,'500M','640M')]:
     (directory/f'vmmap-{c}-{kind}-{pid}.txt').write_text(f'Physical footprint: {value}\nPhysical footprint (peak): {peak}\n')
 def mutate(self,fn):
  p=self.paths[0];r=json.loads(p.read_text());fn(r);p.write_text(json.dumps(r))
 def rejects(self,message):
  with self.assertRaisesRegex(ValueError,message):verify(self.root,self.budget)
 def test_complete_control(self):self.assertTrue(verify(self.root,self.budget)['passed'])
 def test_missing_completion(self):self.paths[0].unlink();self.rejects('completed')
 def test_short_session(self):self.mutate(lambda r:r['residentMemory'][12].update(elapsedMs=1000));self.rejects('too short')
 def test_resource_retention(self):self.mutate(lambda r:r.update(afterRouteUnmount=1));self.rejects('route exit')
 def test_heap_growth(self):self.mutate(lambda r:r['memory'][12].update(usedSize=3000000));self.rejects('heap budget')
 def test_nonfinite_heap(self):self.mutate(lambda r:r['memory'][12].update(usedSize=float('nan')));self.rejects('Invalid retained heap')
 def test_dom_growth(self):self.mutate(lambda r:r['memory'][12]['dom'].update(nodes=151));self.rejects('DOM budget')
 def test_missing_checkpoint(self):self.mutate(lambda r:r['memory'].pop(3));self.rejects('checkpoints')
 def test_peak_limit_in_gib(self):
  (self.paths[0].parent/'vmmap-120-GPU-2.txt').write_text('Physical footprint: 500M\nPhysical footprint (peak): 1.1G\n');self.rejects('Peak physical')
 def test_retained_footprint_growth(self):
  (self.paths[0].parent/'vmmap-120-GPU-2.txt').write_text('Physical footprint: 565M\nPhysical footprint (peak): 640M\n');self.rejects('Retained physical')
 def test_missing_footprint(self):(self.paths[0].parent/'vmmap-60-renderer-1.txt').unlink();self.rejects('Missing footprint')
 def test_sampler_error(self):(self.paths[0].parent/'vmmap-error.txt').write_text('permission denied');self.rejects('capture error')

if __name__=='__main__':unittest.main()
