import importlib.util
from pathlib import Path
import unittest
import numpy as np

spec = importlib.util.spec_from_file_location('compare', Path(__file__).parents[1] / 'compare-renders.py')
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)

class ComparisonTests(unittest.TestCase):
    def fixture(self):
        gel = np.zeros((100, 80), dtype=np.float32)
        gel[20:24, 2:8] = 200
        return gel

    def test_identical(self):
        result = compare.compare(self.fixture(), self.fixture(), 8)
        self.assertTrue(result['passed'])
        self.assertEqual(result['mean_difference'], 0)
        self.assertIsNone(result['lanes'][1][0])

    def test_shifted_band_fails_even_with_low_mean_difference(self):
        a = self.fixture()
        result = compare.compare(a, np.roll(a, 5, axis=0), 8)
        self.assertLess(result['mean_difference'], 6)
        self.assertFalse(result['passed'])

    def test_missing_band_fails(self):
        a = self.fixture()
        self.assertFalse(compare.compare(a, np.zeros_like(a), 8)['passed'])

    def test_brightness_difference_fails(self):
        a = np.full((100, 80), 100, dtype=np.float32)
        self.assertFalse(compare.compare(a, a + 10, 8)['passed'])

    def test_size_and_lane_validation(self):
        with self.assertRaises(ValueError):
            compare.compare(self.fixture(), np.zeros((50, 80)), 8)
        with self.assertRaises(ValueError):
            compare.compare(self.fixture(), self.fixture(), 0)

if __name__ == '__main__':
    unittest.main()
