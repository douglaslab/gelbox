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
        self.assertTrue(data['repeatCaptureIdentical'])
        self.assertEqual(data['gelboxCommit'], '5f51097')
        self.assertEqual(data['cinderCommit'], 'f90f332d1a4d453282c76435f3401271f25922f9')
        self.assertEqual(set(data['hashes']), {'build-image.py', 'image-driver.cpp', 'image-cases.json', 'image-outputs.json', 'test_image.py'})
        for name, digest in data['hashes'].items():
            self.assertEqual(hashlib.sha256((ROOT / name).read_bytes()).hexdigest(), digest, name)

if __name__ == '__main__':
    unittest.main()
