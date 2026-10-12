#!/usr/bin/env python3
"""Independent expected observations, not a second resize implementation."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent
EXPECTED = {
    'landscape_min': ([100, 80, 132, 96], False),
    'portrait_min': ([100, 80, 116, 112], False),
    'expand_width': ([100, 80, 400, 230], False),
    'expand_height': ([100, 80, 340, 200], False),
    'snap_inside': ([100, 80, 300, 180], False),
    'snap_outside': ([100, 80, 296, 178], False),
    'snap_euclidean': ([100, 80, 297, 277], False),
    'snap_exact_threshold': ([0, 0, 33.36079406738281, 37.994239807128906], False),
    'handle_top_left': ([100, 80, 340, 200], False),
    'handle_before_left': ([120, 100, 320, 200], False),
    'handle_before_top': ([120, 100, 320, 200], False),
    'drag_sequence': ([130, 65, 330, 165], False),
    'drag_return': ([100, 80, 300, 180], False),
    'left_contact': ([-200, 80, 0, 180], False),
    'left_outside': ([-201, 80, -1, 180], True),
    'right_contact': ([800, 80, 1000, 180], False),
    'right_outside': ([801, 80, 1001, 180], True),
    'top_contact': ([100, -100, 300, 0], False),
    'top_outside': ([100, -101, 300, -1], True),
    'bottom_contact': ([100, 600, 300, 700], False),
    'bottom_outside': ([100, 601, 300, 701], True),
    'delete': ([100, 80, 300, 180], True),
    'backspace': ([100, 80, 300, 180], True),
    'escape': ([100, 80, 300, 180], False),
}

PINNED_SOURCES = {
    "src/ImageView.cpp": "af9de7276de1cad5569482afc57db7cc95d140e702353f0ed15a8810012118ee",
    "include/ImageView.h": "a267106ffcc26dcf3daf53cd1f955898428ed0d4b270dfa43735b8ae6ca4d94c",
    "src/View.cpp": "779407bb1a374f55a3b54afc5bbe82c3b73d87633f3a955b0c93a1da5c7cefae",
    "include/View.h": "6b9b0cbfcff84e4bc6fa8be4e82370ce685dc752906a0fa527df4879ef428950",
    "src/GelboxApp.cpp": "60b3b146eff30d3bbcece66ca34e846777792f5094ca648b0e7771d914c72e47",
    "src/GelView.cpp": "20159d314759e38b6e2f626fba2c5a401eb4cbf894f15682c597c6145e96a3e6",
    "src/SampleView.cpp": "c69251430da6eedbf1b73cf9fdbf0c5eedc4f4f19a172be935661238e2ac555a"
}
PINNED_GEOMETRY = {
    "include/cinder/Rect.h": "fd135821eddd98c96d0eb2ce6f9a91ff10b7d49f20ba9d22fe4d8d6ce5d8ae78",
    "src/cinder/Rect.cpp": "b47e1336be2c2714668be45a95b4c256215c120d78383e65ffcf5c0b0d6d50ed"
}
PINNED_EXTRACTION = 'd0aaca1b09e92dcf696675299e2c0709cedc5da2a1ce195489a278012af16c65'

class NativeImageContract(unittest.TestCase):
    def test_observations(self):
        self.assertTrue((ROOT / 'image-outputs.json').exists(), 'native image capture missing')
        rows = json.loads((ROOT / 'image-outputs.json').read_text())
        self.assertEqual(len(rows), len(EXPECTED))
        self.assertEqual({r['id'] for r in rows}, set(EXPECTED))
        for row in rows:
            frame, removed = EXPECTED[row['id']]
            with self.subTest(case=row['id']):
                for actual, expected in zip(row['frame'], frame, strict=True):
                    self.assertAlmostEqual(actual, expected, delta=0.0001)
                self.assertEqual(row['removed'], removed)
                self.assertEqual(row['focusCalls'], 1)
                expected_handle = [frame[2]-16, frame[3]-16, frame[2], frame[3]]
                for actual, expected in zip(row['handle'], expected_handle, strict=True):
                    self.assertAlmostEqual(actual, expected, delta=0.0001)

    def test_provenance(self):
        self.assertTrue((ROOT / 'image-provenance.json').exists(), 'native image provenance missing')
        data = json.loads((ROOT / 'image-provenance.json').read_text())
        self.assertIs(data['repeatCaptureIdentical'], True)
        self.assertEqual(data['gelboxFullCommit'], '5f5109705279085fcf6bcac6c8be1c9806b6d3d6')
        self.assertEqual(data['sourceHashes'], PINNED_SOURCES)
        self.assertEqual(data['cinderGeometryHashes'], PINNED_GEOMETRY)
        self.assertEqual(data['extractedSha256'], PINNED_EXTRACTION)
        for name in ['compiler', 'host', 'compileFlags']:
            self.assertIsInstance(data[name], str)
            self.assertTrue(data[name].strip(), name)
        for name in ['executableSha256', 'cinderLibrarySha256']:
            self.assertRegex(data[name], r'^[0-9a-f]{64}$', name)
        self.assertIsInstance(data['limitations'], list)
        self.assertTrue(data['limitations'])
        self.assertEqual(data['gelboxCommit'], '5f51097')
        self.assertEqual(data['cinderCommit'], 'f90f332d1a4d453282c76435f3401271f25922f9')
        self.assertEqual(set(data['hashes']), {'build-image.py', 'image-driver.cpp', 'image-cases.json', 'image-outputs.json', 'test_image.py'})
        for name, digest in data['hashes'].items():
            self.assertEqual(hashlib.sha256((ROOT / name).read_bytes()).hexdigest(), digest, name)

if __name__ == '__main__':
    unittest.main()
