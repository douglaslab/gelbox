#!/usr/bin/env python3
"""Capture pinned SampleFragRef methods with standard-library storage adapters."""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
NATIVE = os.environ.get('GELBOX_REFERENCE_REPO', '/Users/shawn/code/gelbox')
REV = '5f51097'

def run(*args):
    return subprocess.check_output(args)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def main():
    sources = {name: run('git', '-C', NATIVE, 'show', f'{REV}:{name}')
               for name in ['include/Sample.h', 'src/Sample.cpp']}
    header = sources['include/Sample.h'].decode()
    source = sources['src/Sample.cpp'].decode()
    # Top-level native class/method endings start at column zero. Copy bytes;
    # do not translate control flow or data operations into the driver.
    start = header.index('class SampleFragRef\n')
    declaration = header[start:header.index('\n};', start) + 3]
    signatures = ['bool SampleFragRef::isValid()', 'bool SampleFragRef::isValidIn(',
                  'bool SampleFragRef::isa(', 'bool SampleFragRef::setToOrigin()',
                  'bool SampleFragRef::setToRoot()', 'int Sample::cloneFragment(',
                  'void Sample::removeFragment(']
    methods = []
    for signature in signatures:
        assert source.count(signature) == 1, signature
        start = source.index(signature)
        methods.append(source[start:source.index('\n}', start) + 2])
    extracted = {'identity-declaration.inc': declaration.encode(),
                 'identity-methods.inc': ('\n\n'.join(methods) + '\n').encode()}
    with tempfile.TemporaryDirectory(prefix='gel-native-identity-') as temp:
        scratch = Path(temp)
        for name, data in extracted.items():
            (scratch / name).write_bytes(data)
        executable = scratch / 'identity'
        flags = ['-std=c++17', '-O2', '-Wall', '-Wextra']
        subprocess.run(['clang++', *flags, '-I', temp, str(ROOT / 'identity-driver.cpp'),
                        '-o', str(executable)], check=True)
        one = run(str(executable))
        two = run(str(executable))
        assert one == two, 'native capture is not deterministic'
        output = json.loads(one)
        (ROOT / 'identity-outputs.json').write_text(json.dumps(output, indent=2) + '\n')
        manifest = {
            'gelboxCommit': REV,
            'gelboxFullCommit': run('git', '-C', NATIVE, 'rev-parse', REV).decode().strip(),
            'sourceHashes': {n: sha(d) for n, d in sources.items()},
            'extractedHashes': {n: sha(d) for n, d in extracted.items()},
            'compiler': run('clang++', '--version').decode(),
            'compileFlags': flags,
            'host': platform.platform(),
            'executableSha256': sha(executable.read_bytes()),
            'repeatCaptureIdentical': True,
            'hashes': {n: sha((ROOT / n).read_bytes()) for n in
                       ['build-identity.py', 'identity-driver.cpp', 'identity-outputs.json', 'test_identity.py']},
            'limitations': [
                'Sample storage adapter includes only bases, ancestry, ID and vector storage; no Cinder or native constructor.',
                'Lane movement and sample copying are driver operations, not extracted GelView transitions.',
                'No dye compaction, UI selection clearing, focus, RNG, cycles or raster certification.',
                'Modern clang/libc++ evidence, not original release executable certification.',
            ],
        }
        (ROOT / 'identity-provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
        print(f'Captured {len(output)} native identity observations twice identically')

if __name__ == '__main__':
    main()
