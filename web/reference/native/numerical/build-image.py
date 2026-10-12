#!/usr/bin/env python3
"""Capture unchanged ImageView methods with real Cinder geometry, without a GUI."""
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
    sources = {name: run('git', '-C', NATIVE, 'show', f'{REV}:{name}') for name in
               ['src/ImageView.cpp', 'include/ImageView.h', 'src/View.cpp', 'include/View.h', 'src/GelboxApp.cpp', 'src/GelView.cpp', 'src/SampleView.cpp']}
    source = sources['src/ImageView.cpp'].decode()
    parts = []
    for signature in ['void ImageView::mouseDown(', 'void ImageView::mouseDrag(',
                      'void ImageView::mouseUp(', 'void ImageView::keyDown(',
                      'ci::Rectf ImageView::calcResizeBox() const']:
        assert source.count(signature) == 1, signature
        start = source.index(signature)
        parts.append(source[start:source.index('\n}', start)+2])
    extracted = ('\n\n'.join(parts)+'\n').encode()
    with tempfile.TemporaryDirectory(prefix='gel-native-image-') as temp:
        scratch = Path(temp)
        (scratch/'image-methods.inc').write_bytes(extracted)
        (scratch/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(GelImage LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
include("{CINDER}/lib/macosx/Release/cinderConfig.cmake")
add_executable(gel-image "{ROOT}/image-driver.cpp")
target_include_directories(gel-image PRIVATE "{scratch}")
target_link_libraries(gel-image PRIVATE cinder)
''')
        subprocess.run(['cmake', '-S', temp, '-B', str(scratch/'build'), '-DCMAKE_BUILD_TYPE=Release'], check=True)
        subprocess.run(['cmake', '--build', str(scratch/'build'), '-j', '4'], check=True)
        executable = scratch/'build/gel-image'
        cmd = [str(executable), str(ROOT/'image-cases.json')]
        one, two = run(*cmd), run(*cmd)
        assert one == two, 'native capture is not deterministic'
        output = json.loads(one)
        (ROOT/'image-outputs.json').write_bytes(one)
        manifest = {
            'gelboxCommit': REV,
            'gelboxFullCommit': run('git', '-C', NATIVE, 'rev-parse', REV).decode().strip(),
            'cinderCommit': CINDER_REV,
            'sourceHashes': {n: sha(d) for n,d in sources.items()},
            'cinderGeometryHashes': {n: sha((CINDER/n).read_bytes()) for n in ['include/cinder/Rect.h', 'src/cinder/Rect.cpp']},
            'extractedSha256': sha(extracted),
            'compiler': run('clang++', '--version').decode(),
            'compileFlags': (scratch/'build/CMakeFiles/gel-image.dir/flags.make').read_text(),
            'host': platform.platform(),
            'executableSha256': sha(executable.read_bytes()),
            'cinderLibrarySha256': sha((CINDER/'lib/macosx/Release/libcinder.a').read_bytes()),
            'repeatCaptureIdentical': True,
            'hashes': {n: sha((ROOT/n).read_bytes()) for n in ['build-image.py', 'image-driver.cpp', 'image-cases.json', 'image-outputs.json', 'test_image.py']},
            'limitations': [
                'Event positions, root coordinate identity, texture dimensions and view storage are adapters; no native GUI event dispatch.',
                'Collection adapter counts focus requests and removal; it does not certify native stacking or keyboard ownership.',
                'Constructor, image decoding, drawing, texture sampling, browser input and file operations are not executed.',
                'Modern pinned Cinder/ARM64 library, not original executable/toolchain certification.',
            ],
        }
        (ROOT/'image-provenance.json').write_text(json.dumps(manifest, indent=2)+'\n')
        print(f'Captured {len(output)} native image scenarios twice identically')

if __name__ == '__main__':
    main()
