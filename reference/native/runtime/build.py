#!/usr/bin/env python3
"""Extract pinned native methods into a headless, explicitly scripted runtime."""
import argparse
import hashlib
import json
from pathlib import Path
import platform
import subprocess

ROOT = Path(__file__).resolve().parent
NATIVE_REV = '5f5109705279085fcf6bcac6c8be1c9806b6d3d6'
CINDER_REV = 'f90f332d1a4d453282c76435f3401271f25922f9'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def run(*args):
    return subprocess.check_output([str(x) for x in args])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--build', default='/tmp/gel-native-runtime')
    parser.add_argument('--gelbox', default='/Users/shawn/code/gelbox')
    parser.add_argument('--cinder', default='/Users/shawn/code/Cinder')
    args = parser.parse_args()
    out, cinder = Path(args.build).resolve(), Path(args.cinder).resolve()
    out.mkdir(parents=True, exist_ok=True)
    assert run('git', '-C', cinder, 'rev-parse', 'HEAD').decode().strip() == CINDER_REV
    assert not run('git', '-C', cinder, 'status', '--porcelain').strip()
    names = ['src/MolecularSim.cpp', 'include/MolecularSim.h', 'src/SampleView.cpp',
             'include/SampleView.h', 'src/FragmentView.cpp', 'src/ColorPaletteView.cpp',
             'src/View.cpp', 'src/GelView.cpp', 'src/GelboxApp.cpp', 'include/Config.h',
             'src/GelSim.cpp', 'include/GelSim.h', 'src/Sample.cpp', 'include/Sample.h',
             'include/Buffer.h', 'include/Band.h', 'include/Dye.h', 'include/Aggregate.h',
             'assets/tuning/gel-sim.json', 'assets/tuning/molecular-sim.json']
    sources = {n: run('git', '-C', args.gelbox, 'show', f'{NATIVE_REV}:{n}') for n in names}
    for name, data in sources.items():
        dest = out / 'pinned' / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    extractions = {}

    def extract(name, signature, end='\n}'):
        source = sources[name].decode()
        assert source.count(signature) == 1, signature
        start = source.index(signature)
        text = source[start:source.index(end, start)+len(end)]
        extractions[signature] = {'source': name, 'sha256': sha(text.encode())}
        return text

    def line(name, token):
        lines = [s for s in sources[name].decode().splitlines() if token in s]
        assert len(lines) == 1, token
        extractions[token] = {'source': name, 'sha256': sha(lines[0].encode())}
        return lines[0]

    molecular_methods = ['MolecularSim::MolecularSim()', 'void MolecularSimTuning::load(',
        'static float basesToRadius(', 'float MolecularSim::calcTargetPop(',
        'void MolecularSim::setSample(', 'void MolecularSim::setBounds(',
        'void MolecularSim::preroll(', 'void MolecularSim::tick(',
        'int\nMolecularSim::getRandomWeightedAggregateSize(', 'MolecularSim::Part\nMolecularSim::randomPart(',
        'int  MolecularSim::pickPart(', 'int  MolecularSim::pickFragment(',
        'glm::mat4\nMolecularSim::Part::getRootTransform(', 'glm::mat4\nMolecularSim::Part::getTransform(']
    (out/'molecular-functions.inc').write_text('\n'.join(extract('src/MolecularSim.cpp', s) for s in molecular_methods)+'\n')
    for signature, filename, end in [('class MolecularSimTuning', 'molecular-tuning.inc', '\n};'),
                                    ('\tclass Frag\n', 'molecular-frag.inc', '\n\t};'),
                                    ('\tclass Part\n', 'molecular-part.inc', '\n\t};')]:
        (out/filename).write_text(extract('include/MolecularSim.h', signature, end)+'\n')
    (out/'molecular-set-rand.inc').write_text(line('include/MolecularSim.h', 'void setRand(')+'\n')
    (out/'degrade-filter.inc').write_text(line('include/MolecularSim.h', 'class DegradeFilter :')+'\n')
    adapter = (ROOT/'../numerical/molecular-adapter.h').read_text()
    assert adapter.count('class MolecularSim {\npublic:') == 1
    (out/'molecular-adapter.h').write_text(adapter.replace('class MolecularSim {\npublic:', 'class MolecularSim {\npublic:\n  MolecularSim();'))
    (out/'sample-constructor.cpp').write_text('#include "Sample.h"\n'+extract('src/Sample.cpp', 'void Sample::clearDyes()')+'\n')
    (out/'view-tick.inc').write_text(extract('src/View.cpp', 'void ViewCollection::tick( float dt )')+'\n')
    (out/'sample-set-rand.inc').write_text(line('include/SampleView.h', 'void setRand(')+'\n')
    (out/'view-setup-seed.inc').write_text(line('src/SampleView.cpp', 'mRand.seed( randInt() )')+'\n')
    (out/'inspector-random.inc').write_text('\n'.join(line('src/FragmentView.cpp', s) for s in [
        'aggregate.mGraphValues.resize(', 'for( float &x : aggregate.mGraphValues )'])+'\n')
    constants = '\n'.join(line('src/SampleView.cpp', 'const '+typ+' '+name+' =') for typ, name in [
        ('int','kRandFragMinNumBases'), ('int','kRandFragMaxNumBases'),
        ('float','kRandFragMaxAspect'), ('int','kNewFragNumAggregateBands')])
    methods = [extract('src/ColorPaletteView.cpp', 'ci::Color ColorPaletteView::Palette::getRandomColor('),
               extract('src/ColorPaletteView.cpp', 'ColorPaletteView::Palette::Palette('),
               extract('src/FragmentView.cpp', 'const vector<Color>& FragmentView::getColorPalette()'),
               extract('src/FragmentView.cpp', 'ci::Color FragmentView::getRandomColorFromPalette('),
               extract('src/SampleView.cpp', 'void SampleView::newFragment()')]
    (out/'species-methods.inc').write_text(constants+'\n'+'\n'.join(methods)+'\n')
    # Preserve the anchor/time expression, while supplying its GUI-derived inputs.
    view = sources['src/GelView.cpp'].decode()
    start = view.index('view->setRand( ci::Rand(')+len('view->setRand( ci::Rand(')
    expression = view[start:view.index(') );', start)]
    extractions['loupe seed expression'] = {'source': 'src/GelView.cpp', 'sha256': sha(expression.encode())}
    (out/'loupe-seed.inc').write_text('uint32_t loupeSeed(vec2 withSampleAtPos, float time) { struct Gel {float time; float getTime(){return time;}} gel{time}; auto mGel=&gel; return '+expression+'; }\n')
    (out/'prefix.h').write_text('#include "cinder/Cinder.h"\n#include "cinder/gl/gl.h"\n#include "cinder/JsonTree.h"\n')
    (out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(GelRuntimeReference LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(gel-runtime "{ROOT}/driver.cpp" "{out}/pinned/src/GelSim.cpp" "{out}/sample-constructor.cpp" "{cinder}/src/cinder/JsonTree.cpp" "{cinder}/src/jsoncpp/jsoncpp.cpp")
target_include_directories(gel-runtime PRIVATE "{out}" "{out}/pinned/include")
target_compile_options(gel-runtime PRIVATE -include "{out}/prefix.h")
target_link_libraries(gel-runtime PRIVATE cinder)
''')
    subprocess.run(['cmake', '-S', str(out), '-B', str(out/'build'), '-DCMAKE_BUILD_TYPE=Release'], check=True)
    subprocess.run(['cmake', '--build', str(out/'build'), '-j', '4'], check=True)
    executable = out/'build/gel-runtime'
    command = [executable, ROOT/'cases.json', out/'pinned/assets/tuning/gel-sim.json', out/'pinned/assets/tuning/molecular-sim.json']
    output = run(*command)
    assert output == run(*command), 'Composed reference differs across process executions'
    (ROOT/'outputs.json').write_bytes(output)
    provenance = {
        'gelboxCommit': NATIVE_REV, 'cinderCommit': CINDER_REV,
        'sourceHashes': {n: sha(d) for n, d in sources.items()},
        'extractions': extractions,
        'generatedHashes': {p.name: sha(p.read_bytes()) for p in out.glob('*.inc')},
        'cinderHashes': {n: sha((cinder/n).read_bytes()) for n in ['include/cinder/Rand.h', 'src/cinder/Rand.cpp', 'include/cinder/CinderMath.h']},
        'compiler': run('clang++', '--version').decode(), 'host': platform.platform(),
        'compileFlags': (out/'build/CMakeFiles/gel-runtime.dir/flags.make').read_text(),
        'librarySha256': sha((cinder/'lib/macosx/Release/libcinder.a').read_bytes()),
        'executableSha256': sha(executable.read_bytes()), 'repeatCaptureIdentical': True,
        'hashes': {n: sha((ROOT/n).read_bytes()) for n in ['build.py', 'driver.cpp', 'cases.json', 'outputs.json', 'test_runtime.py', '../numerical/molecular-adapter.h']},
        'limitations': [
            'Modern Cinder/ARM64 toolchain, not original executable equivalence or raster certification.',
            'Native methods are unchanged; GUI setup contributes only its seed statement and inspector contributes only graph allocation/random initialization.',
            'View ownership, scripted events, sample input and molecular tick dispatch are adapters; native SampleView/GelView GUI orchestration is not executed.',
            'fragmentDidChange records notification only; source-to-loupe refresh is an explicit script operation, not an automatically verified GUI callback.',
            'Loupe input is a supplied sample; native band-to-loupe extraction is covered by the separate numerical harness.',
            'RNG peeks copy local streams; terminal global probe intentionally consumes one integer after all scenario actions.',
        ],
    }
    (ROOT/'provenance.json').write_text(json.dumps(provenance, indent=2)+'\n')
    print(f'Captured {len(json.loads(output))} native runtime scenarios twice identically')


if __name__ == '__main__':
    main()
