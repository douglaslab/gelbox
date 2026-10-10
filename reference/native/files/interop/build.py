"""Build pinned native sample JSON/XML reader and JSON writer without GUI or replacement JSON adapters."""
from pathlib import Path
import subprocess,hashlib,json
root=Path(__file__).resolve().parent
out=Path('/tmp/gel-native-file-interop');out.mkdir(exist_ok=True)
cinder=Path('/Users/shawn/code/Cinder');native='/Users/shawn/code/gelbox'
assert subprocess.check_output(['git','-C',str(cinder),'rev-parse','HEAD']).decode().strip()=='f90f332d1a4d453282c76435f3401271f25922f9'
assert not subprocess.check_output(['git','-C',str(cinder),'status','--porcelain']).strip()
names=['include/Sample.h','include/Buffer.h','include/Dye.h','include/Aggregate.h','include/Serialize.h','src/Sample.cpp','src/Buffer.cpp']
hashes={}
for name in names:
 data=subprocess.check_output(['git','-C',native,'show','5f51097:'+name]);dest=out/name;dest.parent.mkdir(exist_ok=True,parents=True);dest.write_bytes(data);hashes[name]=hashlib.sha256(data).hexdigest()
s=(out/'src/Buffer.cpp').read_text();parts=[]
for signature in ['ci::XmlTree Buffer::toXml()', 'ci::JsonTree Buffer::toJson()', 'Buffer::Buffer( const ci::JsonTree& j )']:
 start=s.index(signature);end=s.index('\n}',start)+2;parts.append(s[start:end])
(out/'buffer-serialization.cpp').write_text('#include "Buffer.h"\n#include "Serialize.h"\nnamespace Gelbox { using namespace ci;\n'+'\n'.join(parts)+'\n}\n')
(out/'prefix.h').write_text('#include "cinder/Cinder.h"\n#include "cinder/gl/gl.h"\n#include "cinder/JsonTree.h"\n')
(out/'CMakeLists.txt').write_text(f'''cmake_minimum_required(VERSION 3.16)
project(GelFileInterop LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
include("{cinder}/lib/macosx/Release/cinderConfig.cmake")
add_executable(gel-file-interop "{root}/driver.cpp" "{out}/src/Sample.cpp" "{out}/buffer-serialization.cpp" "{cinder}/src/cinder/JsonTree.cpp" "{cinder}/src/jsoncpp/jsoncpp.cpp")
target_include_directories(gel-file-interop PRIVATE "{out}/include")
target_compile_options(gel-file-interop PRIVATE -include "{out}/prefix.h")
target_link_libraries(gel-file-interop PRIVATE cinder)
''')
subprocess.run(['cmake','-S',str(out),'-B',str(out/'build'),'-DCMAKE_BUILD_TYPE=Release'],check=True)
subprocess.run(['cmake','--build',str(out/'build'),'-j','4'],check=True)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
(root/'build-provenance.json').write_text(json.dumps({'nativeCommit':'5f5109705279085fcf6bcac6c8be1c9806b6d3d6','cinderCommit':'f90f332d1a4d453282c76435f3401271f25922f9','sources':hashes,'bufferExtractSha256':sha(out/'buffer-serialization.cpp'),'executableSha256':sha(out/'build/gel-file-interop'),'compiler':subprocess.check_output(['clang++','--version']).decode(),'limitations':['Sample JSON/XML constructors and JSON writer only; does not run Gel constructor or application file dispatch.','Uses retained Cinder JsonTree/jsoncpp source with modern compiler and prebuilt Cinder library; not original executable equivalence.','Buffer GUI icon loader excluded; native serialization functions extracted verbatim.']},indent=2)+'\n')
