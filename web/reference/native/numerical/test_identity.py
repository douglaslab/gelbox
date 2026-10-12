#!/usr/bin/env python3
"""Contract checks for compiled native identity evidence; no GUI claims."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent
EXPECTED = {
    'distinct_equal_ids': True,
    'same_pointer_equal': True,
    'wrong_sample_invalid': True,
    'sample_only_invalid_but_retained': True,
    'invalid_same_ref_equal': True,
    'move_preserves_reference': True,
    'off_document_reference_valid': True,
    'removed_slot_now_last_bases': 300,
    'former_last_index_invalid': True,
    'removed_slot_index_unchanged': 0,
    'append_revalidates_old_index': True,
    'clone_new_index': 3,
    'clone_preserves_origin': True,
    'one_hop_is_middle': True,
    'root_is_original': True,
    'root_changed': True,
    'root_second_call_unchanged': True,
    'ancestor_matches_descendant': True,
    'descendant_does_not_match_ancestor': True,
    'invalid_origin_hop_changes': True,
    'invalid_origin_keeps_pointer_and_index': True,
    'invalid_origin_stops': True,
    'reference_keeps_sample_alive': True,
    'clear_releases_sample': True,
    'origin_keeps_sample_alive': True,
    'remove_origin_releases_sample': True,
    'copy_is_distinct': True,
    'copy_keeps_origin': True,
}

class NativeIdentityContract(unittest.TestCase):
    def test_capture(self):
        self.assertTrue((ROOT / 'identity-outputs.json').exists(), 'native identity capture is missing')
        self.assertEqual(json.loads((ROOT / 'identity-outputs.json').read_text()), EXPECTED)

    def test_provenance(self):
        self.assertTrue((ROOT / 'identity-provenance.json').exists(), 'native identity provenance is missing')
        manifest = json.loads((ROOT / 'identity-provenance.json').read_text())
        self.assertTrue(manifest['repeatCaptureIdentical'])
        self.assertEqual(manifest['gelboxCommit'], '5f51097')
        for name, digest in manifest['hashes'].items():
            self.assertEqual(hashlib.sha256((ROOT / name).read_bytes()).hexdigest(), digest, name)
        self.assertEqual(set(manifest['hashes']), {'build-identity.py', 'identity-driver.cpp', 'identity-outputs.json', 'test_identity.py'})

if __name__ == '__main__':
    unittest.main()
