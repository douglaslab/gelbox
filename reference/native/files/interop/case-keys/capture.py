#!/usr/bin/env python3
"""Replay the retained mixed-case corpus through the existing native file harness."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parent
exe=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/tmp/gel-native-file-interop/build/gel-file-interop')
for source in sorted(root.glob('*.input.json')):
    result=subprocess.run([str(exe),str(source)],check=True,capture_output=True)
    expected=source.with_name(source.name.replace('.input.json','.native.json'))
    assert result.stdout==expected.read_bytes(),source.name
    print(source.name+': exact native output reproduced')
