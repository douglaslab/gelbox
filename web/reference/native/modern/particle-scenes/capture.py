#!/usr/bin/env python3
"""Capture/verify native particle meshes on four-sample native macOS CGL."""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, tempfile
from PIL import Image
root = Path(__file__).resolve().parent
numerical = root.parents[1] / 'numerical'
p = argparse.ArgumentParser()
p.add_argument('--update', action='store_true')
p.add_argument('--output', type=Path)
p.add_argument('--mesh-build', type=Path, default=Path('/tmp/gel-native-numerical'))
args = p.parse_args()
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
provenance = json.loads((numerical / 'provenance.json').read_text())
assert sha(numerical / 'mesh-cases.json') == provenance['meshCasesSha256']
assert sha(numerical / 'mesh-outputs.json') == provenance['meshOutputsSha256']
assert sha(args.mesh_build / 'build/gel-mesh') == provenance['meshExecutableSha256']
command = [str(args.mesh_build / 'build/gel-mesh'), str(args.mesh_build / 'pinned/assets/tuning/gel-sim.json'), str(numerical / 'mesh-cases.json'), str(args.mesh_build / 'pinned/assets/tuning/molecular-sim.json')]
for _ in range(2): assert subprocess.check_output(command) == (numerical / 'mesh-outputs.json').read_bytes()
gelbox = Path(os.environ.get('GELBOX_REFERENCE_REPO', '/Users/shawn/code/gelbox'))
cinder = Path(os.environ.get('CINDER_REFERENCE_REPO', '/Users/shawn/code/Cinder'))
app = subprocess.check_output(['git', '-C', str(gelbox), 'show', '5f51097:src/GelboxApp.cpp'])
context = subprocess.check_output(['git', '-C', str(cinder), 'show', provenance['cinderCommit'] + ':src/cinder/gl/Context.cpp'])
assert b'RendererGl::Options().msaa(4)' in app
assert b'pushBlendFuncSeparate( GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA, GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA )' in context
rows = json.loads((numerical / 'mesh-outputs.json').read_text())
output = args.output or Path(tempfile.mkdtemp(prefix='gel-particle-raster-'))
output.mkdir(parents=True, exist_ok=True)
header = 'struct Case {std::string id;std::vector<float> data;};\nstd::vector<Case> cases={\n' + ',\n'.join('{"' + r['id'] + '",{' + ','.join(float(v).hex() + 'f' for v in r['data']) + '}}' for r in rows) + '\n};\n'
(output / 'cases.h').write_text(header)
subprocess.run(['clang++', '-std=c++17', '-O2', '-framework', 'OpenGL', '-I' + str(output), str(root / 'driver.cpp'), '-o', str(output / 'capture')], check=True)
runs = []
for name in ['one', 'two']:
    dest = output / name; dest.mkdir(exist_ok=True)
    runs.append(subprocess.check_output([str(output / 'capture'), str(dest)], text=True).strip())
entries = []
for row in rows:
    for scale in [1, 2]:
        key = f"{row['id']}-{scale}"
        raw = (output / 'one' / (key + '.rgba')).read_bytes()
        assert raw == (output / 'two' / (key + '.rgba')).read_bytes()
        image = Image.frombytes('RGBA', (64 * scale, 64 * scale), raw).convert('RGB')
        target = root / (key + '.png')
        if args.update: image.save(target)
        else: assert image.tobytes() == Image.open(target).convert('RGB').tobytes(), key
        entries.append(dict(id=key, mesh=row['id'], scale=scale, sha256=sha(target)))
report = dict(gelboxCommit='5f5109705279085fcf6bcac6c8be1c9806b6d3d6', cinderCommit=provenance['cinderCommit'],
    numericalProvenanceSha256=sha(numerical / 'provenance.json'),
    renderer=runs[0], repeatCaptureIdentical=True, meshCaptureRepeated=True,
    meshSha256=sha(numerical / 'mesh-outputs.json'), driverSha256=sha(root / 'driver.cpp'),
    executableSha256=sha(output / 'capture'), appSha256=hashlib.sha256(app).hexdigest(),
    contextSha256=hashlib.sha256(context).hexdigest(), cases=entries,
    limits=['Native captured meshes, standalone CGL RGBA8 MSAA4; not original GUI output.',
            '64x64 crop of native coordinates [68,132], opaque #F1F1F2 background; RGB comparison only.',
            'Positive-Y projection/raw row order follows window-validated well oracle.',
            'Does not certify particle scheduling, transparent representatives, loupes, or composed UI.'])
(output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
if args.update: (root / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(dict(verified=len(entries), output=str(output), renderer=runs[0])))
