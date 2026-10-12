#!/usr/bin/env python3
"""Capture the native fragment well and representative on one MSAA surface."""
from pathlib import Path
import argparse, hashlib, json, os, subprocess, tempfile
from PIL import Image
root = Path(__file__).resolve().parent
well = root.parent / "fragment-well-scenes"
numerical = root.parents[1] / 'numerical'
p = argparse.ArgumentParser()
p.add_argument('--update', action='store_true')
p.add_argument('--output', type=Path)
p.add_argument('--mesh-build', type=Path, default=Path('/tmp/gel-native-numerical'))
args = p.parse_args()
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
provenance = json.loads((numerical / 'provenance.json').read_text())
assert sha(args.mesh_build / 'build/gel-mesh') == provenance['meshExecutableSha256']
command = [str(args.mesh_build / 'build/gel-mesh'), str(args.mesh_build / 'pinned/assets/tuning/gel-sim.json'), str(root / 'cases.json'), str(args.mesh_build / 'pinned/assets/tuning/molecular-sim.json')]
mesh = subprocess.check_output(command)
assert mesh == subprocess.check_output(command)
if args.update: (root / 'meshes.json').write_bytes(mesh)
else: assert mesh == (root / 'meshes.json').read_bytes()
assert all(not row['selected'] and not row['rollover'] for row in json.loads((root / 'cases.json').read_text()))
gelbox = Path(os.environ.get('GELBOX_REFERENCE_REPO', '/Users/shawn/code/gelbox'))
cinder = Path(os.environ.get('CINDER_REFERENCE_REPO', '/Users/shawn/code/Cinder'))
app = subprocess.check_output(['git', '-C', str(gelbox), 'show', '5f51097:src/GelboxApp.cpp'])
context = subprocess.check_output(['git', '-C', str(cinder), 'show', provenance['cinderCommit'] + ':src/cinder/gl/Context.cpp'])
layout = subprocess.check_output(['git', '-C', str(gelbox), 'show', '5f51097:include/Layout.h'])
fragment = subprocess.check_output(['git', '-C', str(gelbox), 'show', '5f51097:src/FragmentView.cpp'])
assert b'ci::Color::hex(0xF1F1F1)' in layout
assert b'gl::clear( Color( 1, 1, 1 ) )' in app
assert b'drawRepresentativeOfFrag( mEditFragment, mWellRect.getCenter() )' in fragment
assert b'RendererGl::Options().msaa(4)' in app
assert b'pushBlendFuncSeparate( GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA, GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA )' in context
subprocess.run(['python3', str(well / 'build_geometry.py')], check=True)
geometry = json.loads((well / 'geometry.json').read_text())
rows = json.loads(mesh)
inputs = {row['id']: row for row in json.loads((root / 'cases.json').read_text())}
output = args.output or Path(tempfile.mkdtemp(prefix='gel-particle-raster-'))
output.mkdir(parents=True, exist_ok=True)
header = 'struct Case {std::string id;std::vector<float> data;bool visible;};\nstd::vector<Case> cases={\n' + ',\n'.join('{"' + r['id'] + '",{' + ','.join(float(v).hex() + 'f' for v in r['data']) + '},' + ('true' if inputs[r['id']]['part']['fade'] > 0 else 'false') + '}' for r in rows) + '\n};\n'
(output / 'cases.h').write_text(header)
geometry_header = ''
for name, gray in [('shadow',240), ('fill',241), ('stroke',189)]:
    positions = geometry[name]
    vertices = [value for i in range(0,len(positions),2) for value in [positions[i],positions[i+1],gray/255,gray/255,gray/255,1]]
    geometry_header += 'std::vector<float> '+name+'={'+','.join(float(v).hex()+'f' for v in vertices)+'};\n'
(output / 'geometry.h').write_text(geometry_header)
subprocess.run(['clang++', '-std=c++17', '-O2', '-framework', 'OpenGL', '-I' + str(output), str(root / 'driver.cpp'), '-o', str(output / 'capture')], check=True)
runs = []
for name in ['one', 'two']:
    dest = output / name; dest.mkdir(exist_ok=True)
    runs.append(subprocess.check_output([str(output / 'capture'), str(dest)], text=True).strip())
entries = []
for row in rows:
    for scale in [1, 2]:
        for background,rgb in [('white',[255,255,255]),('rose',[217,45,81]),('navy',[26,39,65])]:
            key = f"{row['id']}-{scale}-{background}"
            raw = (output / 'one' / (key + '.rgba')).read_bytes()
            assert raw == (output / 'two' / (key + '.rgba')).read_bytes()
            image = Image.frombytes('RGBA', (303 * scale, 520 * scale), raw).convert('RGB')
            if background=='white':
                assert image.tobytes()==Image.open(well / f"{row['id']}-{scale}.png").convert('RGB').tobytes()
            target = root / (key + '.png')
            if args.update: image.save(target)
            else: assert image.tobytes() == Image.open(target).convert('RGB').tobytes(), key
            entries.append(dict(id=key, mesh=row['id'], scale=scale, background=rgb, sha256=sha(target)))
report = dict(gelboxCommit='5f5109705279085fcf6bcac6c8be1c9806b6d3d6', cinderCommit=provenance['cinderCommit'],
    numericalProvenanceSha256=sha(numerical / 'provenance.json'),
    renderer=runs[0], repeatCaptureIdentical=True, meshCaptureRepeated=True,
    geometrySha256=sha(well / 'geometry.json'), geometryProvenanceSha256=sha(well / 'geometry-provenance.json'),
    meshSha256=sha(root / 'meshes.json'), casesSha256=sha(root / 'cases.json'), driverSha256=sha(root / 'driver.cpp'),
    executableSha256=sha(output / 'capture'), appSha256=hashlib.sha256(app).hexdigest(),
    contextSha256=hashlib.sha256(context).hexdigest(),
    layoutSha256=hashlib.sha256(layout).hexdigest(), fragmentViewSha256=hashlib.sha256(fragment).hexdigest(), cases=entries,
    limits=['Native captured meshes, standalone CGL RGBA8 MSAA4; not original GUI output.',
            '303x520 fragment panel coordinates, white/rose/navy backgrounds, well shadow/fill/stroke then representative; RGB comparison only.',
            'Positive-Y projection/raw row order follows window-validated well oracle.',
            'Legacy Cinder rounded geometry; one physical pixel GL_LINES stroke. Body meshes captured at well center117,111.',
            'Excludes heading, brace, controls, picking, animated representative selection, and overflow outside panel; not full GUI certification.'])
(output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
if args.update: (root / 'manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(dict(verified=len(entries), output=str(output), renderer=runs[0])))
