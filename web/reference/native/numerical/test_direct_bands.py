import hashlib,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parent
PINNED_SOURCES={'src/GelView.cpp': '20159d314759e38b6e2f626fba2c5a401eb4cbf894f15682c597c6145e96a3e6', 'include/Band.h': 'ad2e2da5beacc27ded660ba025d9c18787b48ce40672e0b8f70bb050103b583c'}
PINNED_EXTRACTION='7273709699fe1e797d19e42eba7fb8f1288bf4e30443aec6991acefd353c0a1f'
PINNED_GEOMETRY={'include/cinder/Rect.h': 'fd135821eddd98c96d0eb2ce6f9a91ff10b7d49f20ba9d22fe4d8d6ce5d8ae78', 'src/cinder/Rect.cpp': 'b47e1336be2c2714668be45a95b4c256215c120d78383e65ffcf5c0b0d6d50ed', 'include/cinder/TriMesh.h': '0c3d8ad39081cbec961402783337da16940693c2ed21a2e535e83795f671a0ad', 'src/cinder/TriMesh.cpp': '333bdf2ba8f2e745e677ee2ecbb81ec4e4941288a4a632f1188936de76c68175', 'include/cinder/Color.h': '75a6c44ec63534e242da1226edadcc93262648d01b2c6a79d2caed078f5704cb'}
class DirectBandsTests(unittest.TestCase):
 def test_contract(self):
  rows={r['id']:r['data'] for r in json.loads((ROOT/'direct-bands-outputs.json').read_text())}
  counts={'empty':0,'body':6,'blur':12,'below':12,'above':12,'flame':12,'equal':12,'negative':18,'all':24,'fractional':24,'zero-brightness':18,'negative-below':6,'negative-blur':12,'overlap':18}
  self.assertEqual(set(rows),set(counts))
  for name,count in counts.items():self.assertEqual(len(rows[name]),count*6,name)
  def vertex(name,i,want):
   for a,b in zip(rows[name][i*6:i*6+6],want,strict=True):self.assertAlmostEqual(a,b,delta=.00001)
  vertex('body',0,[10,30,.2,.4,.6,.5]);vertex('body',1,[40,30,.2,.4,.6,.5]);vertex('body',2,[40,34,.2,.4,.6,.5])
  vertex('blur',0,[7,27,.2,.4,.6,.1])
  vertex('below',6,[10,34,.7,.7,.7,1]);vertex('below',8,[40,44,.1,.1,.1,1])
  vertex('above',6,[10,20,.7,.7,.7,1]);vertex('above',8,[40,30,.1,.1,.1,1])
  vertex('flame',6,[10,18,.2,.4,.6,0]);vertex('flame',8,[40,30,.2,.4,.6,.5])
  self.assertEqual(rows['flame'],rows['equal'])
  vertex('negative',0,[8,33,.2,.4,.6,.1]);vertex('negative',12,[10,35,.7,.7,.7,1])
  vertex('all',0,[6,6,.2,.4,.6,.1]);vertex('all',18,[10,10,.7,.7,.7,1])
  vertex('fractional',0,[-4.234567,-2.641976,.2,.4,.6,.02469134])
  vertex('zero-brightness',6,[10,34,.7,.7,.7,1])
  self.assertEqual(rows['negative-below'],rows['body'])
  vertex('negative-blur',0,[12,32,.2,.4,.6,.1]);vertex('overlap',6,[10,30,1,0,0,.25])
 def test_provenance(self):
  p=json.loads((ROOT/'direct-bands-provenance.json').read_text())
  self.assertEqual(p['sourceHashes'],PINNED_SOURCES)
  self.assertEqual(p['cinderGeometryHashes'],PINNED_GEOMETRY)
  self.assertEqual(p['extractedSha256'],PINNED_EXTRACTION)
  self.assertEqual(p['gelboxFullCommit'],'5f5109705279085fcf6bcac6c8be1c9806b6d3d6')
  self.assertEqual(p['cinderCommit'],'f90f332d1a4d453282c76435f3401271f25922f9')
  self.assertTrue(p['repeatCaptureIdentical'])
  for name in ['compiler','compileFlags','host','limitations']:self.assertTrue(p[name])
  for name in ['executableSha256','cinderLibrarySha256']:self.assertRegex(p[name],r'^[0-9a-f]{64}$')
  self.assertEqual(set(p['hashes']),{'build-direct-bands.py','direct-bands-driver.cpp','direct-bands-cases.json','direct-bands-outputs.json','test_direct_bands.py'})
  for name,digest in p['hashes'].items():self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),digest,name)
if __name__=='__main__':unittest.main()
