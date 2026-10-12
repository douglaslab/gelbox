import hashlib
import json
from pathlib import Path
import struct
import unittest

ROOT = Path(__file__).resolve().parent
PINNED_NATIVE_CONTRACT = '47ef35783bf590f53053703505637783a1cfd15d516cc421bd270efdb2dbc121'
PINNED_ADAPTER = '0f842f7b7ca207e932d793f696e284a4db724fddb4e2a819705a083f3e71f7e9'


def f32(value):
    return struct.unpack('f', struct.pack('f', value))[0]


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.rows = {r['id']: r for r in json.loads((ROOT / 'outputs.json').read_text())}

    def view(self, case, name, step=-1):
        return self.rows[case]['frames'][step]['views'][name]

    def test_constructor_and_inspector_streams(self):
        plain = self.view('construct', 'a')
        self.assertEqual(plain['engineSeed'], -779453450)
        self.assertEqual(plain['viewSeed'], -1593094532)
        self.assertEqual(self.view('construct', 'b')['engineSeed'], -1423486980)
        self.assertEqual(self.rows['construct']['nextGlobalInt'], -108423167)
        self.assertEqual(self.view('inspector', 'b')['engineSeed'], -970001149)
        self.assertEqual(self.rows['inspector']['nextGlobalInt'], -210675709)
        self.assertEqual(plain['nextLocalInt'], self.view('inspector', 'a')['nextLocalInt'])

    def test_species_consumes_six_local_draws_and_native_float_math(self):
        row = self.rows['species']
        initial = self.view('species', 'a', 0)
        trace = row['streams']['a']
        self.assertEqual(initial['nextLocalInt'], trace['ints'][0])
        for i, step in enumerate([1, 2]):
            view = self.view('species', 'a', step)
            self.assertEqual(view['nextLocalInt'], trace['ints'][(i + 1) * 6])
            frag = view['fragments'][i]
            offset = i * 6
            self.assertEqual(frag['bases'], int(f32(1 + f32(13999 * f32(trace['floats'][offset+1] * trace['floats'][offset+2])))))
            self.assertEqual(frag['mass'], f32(trace['floats'][offset+3] * 175))
            self.assertEqual(frag['aggregate'], [1, 0, 0, 0, 0, 0, 0])
            self.assertEqual((frag['aspectRatio'], frag['degrade'], frag['dye']), (1, 0, -1))
            palette_index = (trace['ints'][offset] % (1 << 64)) % 12
            self.assertEqual(frag['color'], row['palette'][palette_index])
        self.assertEqual(self.view('species', 'b')['engineSeed'], -1423486980)
        self.assertEqual(row['notifications'], ['a:0', 'a:1'])

    def test_global_palette_preserves_unsigned_modulo(self):
        self.assertEqual(self.rows['global-palette']['colors'][0], self.rows['global-palette']['palette'][2])
        self.assertEqual(self.rows['global-palette']['nextGlobalInt'], -1593094532)
        self.assertEqual(self.view('clone-before-loupe', 'a')['nextLocalInt'], self.view('construct', 'a')['nextLocalInt'])
        self.assertNotEqual(self.view('clone-before-loupe', 'b')['engineSeed'], self.view('construct', 'b')['engineSeed'])

    def test_loupe_reset_and_preroll(self):
        row = self.rows['loupe-refresh']
        first = self.view('loupe-refresh', 'b', 2)
        second = self.view('loupe-refresh', 'b', 3)
        self.assertGreater(len(first['parts']), 0)
        self.assertEqual(first['engineSeed'], second['engineSeed'])
        self.assertEqual(first['nextLocalInt'], second['nextLocalInt'])
        # Same local seed/sample, but global angular velocity must advance.
        strip = lambda parts: [{k: v for k, v in p.items() if k != 'angleVel'} for p in parts]
        self.assertEqual(strip(first['parts']), strip(second['parts']))
        self.assertNotEqual(first['parts'][0]['angleVel'], second['parts'][0]['angleVel'])
        # Pausing prevents age advancement, not random initial age assignment.
        self.assertTrue(all(p['fade'] == 1 for p in first['parts']))
        self.assertEqual([p['age'] for p in first['parts']], [p['age'] for p in second['parts']])
        self.assertNotEqual(row['nextGlobalInt'], self.rows['construct']['nextGlobalInt'])

    def test_tick_order_assigns_global_draws_to_views(self):
        angles = lambda case, view: [p['angleVel'] for p in self.view(case, view)['parts']]
        self.assertGreater(len(angles('tick-forward', 'a')), 0)
        self.assertEqual(angles('tick-forward', 'a'), angles('tick-reverse', 'b'))
        self.assertEqual(angles('tick-forward', 'b'), angles('tick-reverse', 'a'))
        self.assertEqual(self.rows['tick-forward']['nextGlobalInt'], self.rows['tick-reverse']['nextGlobalInt'])
        self.assertEqual(self.rows['tick-forward']['tickTrace'], ['a', 'b'])
        self.assertEqual(self.rows['tick-reverse']['tickTrace'], ['b', 'a'])

    def test_tick_snapshot_and_weak_lifetimes(self):
        expected = {'insert-during-tick': ['a', 'b', 'a', 'b', 'c'],
                    'destroy-during-tick': ['a'],
                    'retain-during-tick': ['a', 'b'],
                    'raise-during-tick': ['a', 'b', 'b', 'a']}
        for case, trace in expected.items():
            self.assertEqual(self.rows[case]['tickTrace'], trace, case)
        self.assertEqual(self.rows['replace-view']['frames'][-1]['order'], ['b', 'a2'])
        self.assertNotEqual(self.view('replace-view', 'a2')['viewSeed'], self.view('replace-view', 'a', 0)['viewSeed'])

    def test_inspector_lifetime_and_composed_edits(self):
        self.assertEqual(self.rows['inspector-idempotent']['nextGlobalInt'], self.rows['inspector']['nextGlobalInt'])
        self.assertNotEqual(self.rows['inspector-reopen']['nextGlobalInt'], self.rows['inspector']['nextGlobalInt'])
        self.assertEqual(self.view('edit-with-loupe', 'a')['fragments'], self.view('species', 'a')['fragments'])
        self.assertEqual(self.view('edit-with-loupe', 'a')['nextLocalInt'], self.view('species', 'a')['nextLocalInt'])
        self.assertEqual(self.rows['edit-with-loupe']['notifications'], ['a:0', 'a:1'])
        self.assertGreater(len(self.view('edit-with-loupe', 'b', 7)['parts']), 0)
        self.assertEqual(self.view('edit-with-loupe', 'b', 7)['fragments'], self.view('edit-with-loupe', 'a', 7)['fragments'])

    def test_reference_integrity_and_coverage(self):
        p = json.loads((ROOT / 'provenance.json').read_text())
        self.assertEqual(p['gelboxCommit'], '5f5109705279085fcf6bcac6c8be1c9806b6d3d6')
        self.assertEqual(p['cinderCommit'], 'f90f332d1a4d453282c76435f3401271f25922f9')
        probe = json.loads((ROOT / 'seed-probe-provenance.json').read_text())
        for name, digest in probe['sourceHashes'].items():
            self.assertEqual(p['sourceHashes'][name], digest, name)
        self.assertTrue(p['repeatCaptureIdentical'])
        contract = {k: p[k] for k in ['sourceHashes', 'extractions', 'cinderHashes']}
        self.assertEqual(hashlib.sha256(json.dumps(contract, sort_keys=True).encode()).hexdigest(), PINNED_NATIVE_CONTRACT)
        self.assertEqual(p['hashes']['../numerical/molecular-adapter.h'], PINNED_ADAPTER)
        for field in ['compiler', 'compileFlags', 'limitations', 'extractions', 'librarySha256']:
            self.assertTrue(p[field])
        self.assertEqual(set(p['hashes']), {'build.py', 'driver.cpp', 'cases.json', 'outputs.json', 'test_runtime.py', '../numerical/molecular-adapter.h'})
        for name, digest in p['hashes'].items():
            self.assertEqual(hashlib.sha256((ROOT / name).read_bytes()).hexdigest(), digest, name)
        cases = json.loads((ROOT / 'cases.json').read_text())
        self.assertEqual(len(self.rows), len(cases))
        self.assertEqual(set(self.rows), {c['id'] for c in cases})


if __name__ == '__main__':
    unittest.main()
