#!/usr/bin/env python3
"""Add capture-only instrumentation to a freshly reconstructed compatibility build."""
from pathlib import Path
import argparse,hashlib,json
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent;manifest=json.loads((root.parent/'manifest.json').read_text());source=a.source.resolve()
sha=lambda b:hashlib.sha256(b).hexdigest()
changes={}
for name in ['src/GelboxApp.cpp','proj/cmake/CMakeLists.txt']:
 path=source/name;data=path.read_bytes();assert sha(data)==manifest['sourceHashes'][name],f'Not fresh recorded source: {name}'
 text=data.decode()
 if name.endswith('.cpp'):
  text='#include "cinder/ImageIo.h"\n#include <fstream>\n#include <cstdlib>\n'+text
  needle='\tif ( Interaction::get() ) Interaction::get()->draw();';assert text.count(needle)==1
  text=text.replace(needle,needle+'\n'+(root/'probe.inc').read_text())
 else:text=text.replace('org.douglaslab.Gelbox','org.douglaslab.GelboxControlsReference')
 path.write_text(text);changes[name]={'before':sha(data),'after':sha(path.read_bytes())}
(source.parent/'capture-inputs.json').write_text(json.dumps({'baseManifestSha256':sha((root.parent/'manifest.json').read_bytes()),'probeSha256':sha((root/'probe.inc').read_bytes()),'instrumentSha256':sha(Path(__file__).read_bytes()),'changes':changes},indent=2)+'\n')
