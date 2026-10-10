"""Verify the retained original-release GUI interchange without loose tolerances."""
import hashlib
import json
import struct
from pathlib import Path

root = Path(__file__).resolve().parent
read = lambda name: json.loads((root / name).read_text())
original = read('native-input.json')
web = read('webgpu-edited.json')
assert web == read('webgl2-edited.json'), 'Backend exports differ'
expected = json.loads(json.dumps(original))
expected['Gel']['Buffer'] = dict(Tris=44.5, Borate=44.5, Acetate=0, EDTA=1)
expected['Gel']['Samples'][1]['Buffer'] = dict(Tris=40, Borate=0, Acetate=20, EDTA=1)
old_mass = original['Gel']['Samples'][1]['Fragments'][0]['Mass']
web_mass = web['Gel']['Samples'][1]['Fragments'][0]['Mass']
assert web_mass != old_mass and 0 < web_mass <= 175
expected['Gel']['Samples'][1]['Fragments'][0]['Mass'] = web_mass
assert web == expected, 'Unexpected scientific or metadata edit'
native_mass = struct.unpack('f', struct.pack('f', web_mass))[0]
expected['Gel']['Samples'][1]['Fragments'][0]['Mass'] = native_mass
assert read('native-reread-webgpu.json') == expected, 'Unexpected native reread difference'
report = dict(
    sameBackendDocuments=True,
    nativeRereadMatchesExceptExactFloat32Mass=True,
    originalMass=old_mass, webMass=web_mass, nativeMass=native_mass,
    files={p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.glob('*.json')) if p.name != 'verification.json'},
)
(root / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
