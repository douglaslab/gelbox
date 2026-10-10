"""Build pinned native sample JSON/XML reader and JSON writer without GUI or replacement JSON adapters."""
from pathlib import Path
import subprocess,hashlib,json,re,difflib
root=Path(__file__).resolve().parent
out=Path('/tmp/gel-native-file-interop');out.mkdir(exist_ok=True)
cinder=Path('/Users/shawn/code/Cinder');native='/Users/shawn/code/gelbox'
assert subprocess.check_output(['git','-C',str(cinder),'rev-parse','HEAD']).decode().strip()=='f90f332d1a4d453282c76435f3401271f25922f9'
assert not subprocess.check_output(['git','-C',str(cinder),'status','--porcelain']).strip()
names=['include/Sample.h','include/Buffer.h','include/Dye.h','include/Aggregate.h','include/Serialize.h','src/Sample.cpp','src/Buffer.cpp','src/Gel.cpp','src/GelSim.cpp','include/Gel.h','include/GelSim.h','include/GelRender.h','include/Band.h','assets/tuning/gel-sim.json']
hashes={}
for name in names:
 data=subprocess.check_output(['git','-C',native,'show','5f51097:'+name]);dest=out/name;dest.parent.mkdir(exist_ok=True,parents=True);dest.write_bytes(data);hashes[name]=hashlib.sha256(data).hexdigest()
# Native JSON construction reads layout fields before its caller sets layout.
# Define only that otherwise-indeterminate storage for deterministic headless use.
original=(out/'include/Gel.h').read_text();adapted=original
for pattern,replacement in [
 (r'glm::vec2(\s+)mSize;',r'glm::vec2\1mSize = glm::vec2(390,520);'),
 (r'float(\s+)mYMargin;',r'float\1mYMargin = 20.f;'),
 (r'float(\s+)mLaneWidth;',r'float\1mLaneWidth = 390.f/7.f;'),
 (r'int(\s+)mNumLanes;',r'int\1mNumLanes = 7;'),
]:
 adapted,count=re.subn(pattern,replacement,adapted);assert count==1,pattern
(out/'include/Gel.h').write_text(adapted)
(root/'gel-layout-initialization.patch').write_text(''.join(difflib.unified_diff(original.splitlines(True),adapted.splitlines(True),fromfile='a/include/Gel.h',tofile='b/include/Gel.h')))
s=(out/'src/Buffer.cpp').read_text();parts=[]
for signature in ['ci::XmlTree Buffer::toXml()', 'ci::JsonTree Buffer::toJson()', 'Buffer::Buffer( const ci::JsonTree& j )']:
 start=s.index(signature);end=s.index('\n}',start)+2;parts.append(s[start:end])
(out/'buffer-serialization.cpp').write_text('#include "Buffer.h"\n#include "Serialize.h"\nnamespace Gelbox { using namespace ci;\n'+'\n'.join(parts)+'\n}\n')
(out/'prefix.h').write_text('#include "cinder/Cinder.h"\n#include "cinder/gl/gl.h"\n#include "cinder/JsonTree.h"\n')
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(GelFileInterop LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(gel-file-interop "{root}/driver.cpp" "{out}/src/Sample.cpp" "{out}/src/Gel.cpp" "{out}/src/GelSim.cpp" "{out}/buffer-serialization.cpp" "{cinder}/src/cinder/JsonTree.cpp" "{cinder}/src/jsoncpp/jsoncpp.cpp")
target_include_directories(gel-file-interop PRIVATE "{out}/include")
target_compile_options(gel-file-interop PRIVATE -include "{out}/prefix.h")
target_link_libraries(gel-file-interop PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
(root/'build-provenance.json').write_text(json.dumps({'nativeCommit':'5f5109705279085fcf6bcac6c8be1c9806b6d3d6','cinderCommit':'f90f332d1a4d453282c76435f3401271f25922f9','sources':hashes,'adaptedGelHeaderSha256':sha(out/'include/Gel.h'),'bufferExtractSha256':sha(out/'buffer-serialization.cpp'),'executableSha256':sha(out/'build/gel-file-interop'),'compiler':subprocess.check_output(['clang++','--version']).decode(),'limitations':['Gel/Sample constructors and writers run without application file dispatch or GUI.', 'Gel layout members are initialized to application defaults to avoid indeterminate pre-layout reads; see gel-layout-initialization.patch.','Uses retained Cinder JsonTree/jsoncpp source with modern compiler and prebuilt Cinder library; not original executable equivalence.','Buffer GUI icon loader excluded; native serialization functions extracted verbatim.']},indent=2)+'\n')
