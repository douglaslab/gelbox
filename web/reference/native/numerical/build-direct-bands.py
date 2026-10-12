#!/usr/bin/env python3
"""Capture unchanged GelView::drawBands with real Cinder mesh and geometry, without a GUI."""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
NATIVE = os.environ.get('GELBOX_REFERENCE_REPO', '/Users/shawn/code/gelbox')
CINDER = Path(os.environ.get('CINDER_REFERENCE_REPO', '/Users/shawn/code/Cinder'))
REV = '5f51097'
CINDER_REV = 'f90f332d1a4d453282c76435f3401271f25922f9'

def run(*args):
    return subprocess.check_output(args)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    assert run('git', '-C', str(CINDER), 'rev-parse', 'HEAD').decode().strip() == CINDER_REV
    assert not run('git', '-C', str(CINDER), 'status', '--porcelain').strip(), 'Cinder checkout must be clean'
    sources = {name: run('git', '-C', NATIVE, 'show', f'{REV}:{name}') for name in ['src/GelView.cpp', 'include/Band.h']}
    source = sources['src/GelView.cpp'].decode()
    signature = 'void GelView::drawBands() const'
    assert source.count(signature) == 1
    start = source.index(signature)
    extracted = (source[start:source.index('\n}', start)+2]+'\n').encode()
    with tempfile.TemporaryDirectory(prefix='gel-native-direct-bands-') as temp:
        scratch = Path(temp)
        (scratch/'direct-bands-method.inc').write_bytes(extracted)
        (scratch/'Band.h').write_bytes(sources['include/Band.h'])
        (scratch/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(GelDirectBands LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
include("{CINDER}/lib/macosx/Release/cinderConfig.cmake")
add_executable(gel-direct-bands "{ROOT}/direct-bands-driver.cpp")
target_include_directories(gel-direct-bands PRIVATE "{scratch}")
target_link_libraries(gel-direct-bands PRIVATE cinder)
''')
        subprocess.run(['cmake', '-S', temp, '-B', str(scratch/'build'), '-DCMAKE_BUILD_TYPE=Release'], check=True)
        subprocess.run(['cmake', '--build', str(scratch/'build'), '-j', '4'], check=True)
        executable = scratch/'build/gel-direct-bands'
        cmd = [str(executable), str(ROOT/'direct-bands-cases.json')]
        one, two = run(*cmd), run(*cmd)
        assert one == two, 'native capture is not deterministic'
        output = json.loads(one)
        (ROOT/'direct-bands-outputs.json').write_bytes(one)
        manifest = {
            'gelboxCommit': REV,
            'gelboxFullCommit': run('git', '-C', NATIVE, 'rev-parse', REV).decode().strip(),
            'cinderCommit': CINDER_REV,
            'sourceHashes': {n: sha(d) for n,d in sources.items()},
            'cinderGeometryHashes': {n: sha((CINDER/n).read_bytes()) for n in ['include/cinder/Rect.h', 'src/cinder/Rect.cpp', 'include/cinder/TriMesh.h', 'src/cinder/TriMesh.cpp', 'include/cinder/Color.h']},
            'extractedSha256': sha(extracted),
            'compiler': run('clang++', '--version').decode(),
            'compileFlags': (scratch/'build/CMakeFiles/gel-direct-bands.dir/flags.make').read_text(),
            'host': platform.platform(),
            'executableSha256': sha(executable.read_bytes()),
            'cinderLibrarySha256': sha((CINDER/'lib/macosx/Release/libcinder.a').read_bytes()),
            'repeatCaptureIdentical': True,
            'hashes': {n: sha((ROOT/n).read_bytes()) for n in ['build-direct-bands.py', 'direct-bands-driver.cpp', 'direct-bands-cases.json', 'direct-bands-outputs.json', 'test_direct_bands.py']},
            'limitations': [
                'GelAdapter supplies input bands; gl::draw captures real Cinder TriMesh before rasterization. No GUI or GL context.',
                'Entire drawBands and original Band.h are extracted unchanged; blend factors are checked by the adapter.',
                'Modern pinned Cinder/ARM64 library, not original executable/toolchain or raster certification.',
            ],
        }
        (ROOT/'direct-bands-provenance.json').write_text(json.dumps(manifest, indent=2)+'\n')
        print(f'Captured {len(output)} native direct-bands scenarios twice identically')

if __name__ == '__main__':
    main()
