#!/usr/bin/env python3
"""Extract pinned native CPU warp methods; capture twice without GPU/GUI setup."""
import pathlib, subprocess, hashlib, json, platform
root=pathlib.Path(__file__).resolve().parent
out=pathlib.Path('/tmp/gel-native-warp');out.mkdir(exist_ok=True)
gelbox='/Users/shawn/code/gelbox';cinder='/Users/shawn/code/Cinder'
def run(*args):return subprocess.check_output(args)
def sha(data):return hashlib.sha256(data).hexdigest()
revision='f90f332d1a4d453282c76435f3401271f25922f9'
assert run('git','-C',cinder,'rev-parse','HEAD').decode().strip()==revision
assert not run('git','-C',cinder,'status','--porcelain').strip()
source=run('git','-C',gelbox,'show','5f51097:src/GelRender.cpp')
tuning=run('git','-C',gelbox,'show','5f51097:assets/tuning/gel-render.json')
(out/'tuning.json').write_bytes(tuning)
s=source.decode();parts=[]
for signature in ['ci::Surface8uRef makeWarpByFracPos(', 'void GelRender::smileBand(', 'void GelRender::wellDamageBand(', 'void GelRender::overcook(']:
 start=s.index(signature);end=s.index('\n}',start)+2;parts.append(s[start:end])
(out/'warp-functions.inc').write_text('\n'.join(parts)+'\n')
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(GelWarp LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(gel-warp "{root}/warp-driver.cpp")
target_include_directories(gel-warp PRIVATE "{out}")
target_link_libraries(gel-warp PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
cmd=[str(out/'build/gel-warp'),str(root/'warp-cases.json'),str(out/'tuning.json')]
one=run(*cmd);two=run(*cmd);assert one==two
(root/'warp-outputs.json').write_bytes(one)
manifest={'gelboxCommit':'5f51097','cinderCommit':revision,'sourceSha256':sha(source),'tuningSha256':sha(tuning),'extractedSha256':sha((out/'warp-functions.inc').read_bytes()),'host':platform.platform(),'compiler':run('clang++','--version').decode(),'compileFlags':(out/'build/CMakeFiles/gel-warp.dir/flags.make').read_text(),'executableSha256':sha((out/'build/gel-warp').read_bytes()),'cinderLibrarySha256':sha(pathlib.Path(cinder+'/lib/macosx/Release/libcinder.a').read_bytes()),'repeatCaptureIdentical':True,'hashes':{n:sha((root/n).read_bytes()) for n in ['build-warp.py','warp-driver.cpp','warp-cases.json','warp-outputs.json']},'limitations':['Modern Cinder/ARM64 toolchain, not original executable certification.','Texture upload and GPU warp intercepted; Surface bytes plus scale only.','Alpha 255 supplied by adapter for web RGBA representation of native RGB.']}
(root/'warp-provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Captured {len(json.loads(one))} native warp cases twice identically')
