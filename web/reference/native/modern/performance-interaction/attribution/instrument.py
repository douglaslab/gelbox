"""Add event provenance and detach stacks to a verified performance probe copy."""
from pathlib import Path
import argparse,hashlib,json,shutil
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parent
base=json.loads((root.parents[1]/'manifest.json').read_text())['sourceHashes']
changes=json.loads((root.parent/'instrumentation.json').read_text())['changes']
expected={**base,**{k:v['after'] for k,v in changes.items()}}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for name,digest in expected.items():assert sha(a.source/name)==digest,name
assert not a.output.exists(),'Use a fresh output directory'
source=a.output/'source';shutil.copytree(a.source,source)
f=source/'src/GelboxApp.cpp';s=f.read_text()
helper='''
static const char* gPerfOrigin="external";
struct PerfOriginScope { const char* previous; PerfOriginScope(const char* origin):previous(gPerfOrigin){gPerfOrigin=origin;} ~PerfOriginScope(){gPerfOrigin=previous;} };
static void perfTrace(const char* kind,const void* view=nullptr,int x=0,int y=0,const std::string& detail=""){
 if(const char* root=std::getenv("GEL_PERF_OUTPUT")){
  Json row={{"tick",gPerfTicks},{"origin",gPerfOrigin},{"kind",kind},{"view",reinterpret_cast<uintptr_t>(view)},{"x",x},{"y",y},{"detail",detail}};
  std::ofstream(fs::path(root)/"events.jsonl",std::ios::app)<<row.dump()<<std::endl;
 }
}
void perfDetach(const void* view,const char* name){
 void* frames[24];int n=backtrace(frames,24);char** symbols=backtrace_symbols(frames,n);std::string stack;
 if(symbols){for(int i=0;i<n;++i){stack+=symbols[i];stack+='\\n';}std::free(symbols);}
 perfTrace("detach",view,0,0,std::string(name)+"\\n"+stack);
}
'''
s='#include <execinfo.h>\n'+s
anchor='const bool kVerboseMoveDragEvents';assert s.count(anchor)==1;s=s.replace(anchor,helper+'\n'+anchor)
for method in ['mouseDown','mouseUp','mouseMove','mouseDrag']:
 anchor='void GelboxApp::'+method+'( MouseEvent event )\n{';assert s.count(anchor)==1
 s=s.replace(anchor,anchor+'\n perfTrace("'+method+'",nullptr,event.getX(),event.getY(),std::to_string(event.getModifiers()));')
for method in ['keyDown','keyUp']:
 import re
 pat=r'(void GelboxApp::'+method+r'\s*\( ci::app::KeyEvent event \)\n\{)'
 s,n=re.subn(pat,lambda m:m[1]+'\n perfTrace("'+method+'",nullptr,0,0,std::to_string(event.getCode()));',s);assert n==1
anchor='if(const char* output=std::getenv("GEL_PERF_OUTPUT")){';assert s.count(anchor)==1
s=s.replace(anchor,anchor+'\n try {\n PerfOriginScope probeOrigin("probe");')
anchor='   std::ofstream(root/"loaded.gel.json")';assert s.count(anchor)==1
s=s.replace(anchor,'   perfTrace("watch",sample.get(),0,0,"sample");for(size_t i=0;i<loupes.size();++i)perfTrace("watch",loupes[i].get(),0,0,"loupe-"+std::to_string(i));\n'+anchor)
anchor='  if(gPerfTicks==210)';assert s.count(anchor)==1
s=s.replace(anchor,'  if(gPerfTicks==211 && std::getenv("GEL_PERF_INJECT_CLOSE")){PerfOriginScope fault("fault-injection");perfTrace("injected-close",sample.get());sample->close();}\n'+anchor)
anchor='std::ofstream(root/"performance.json")<<report.dump(2)<<std::endl;recording=false;quit();';assert s.count(anchor)==1
s=s.replace(anchor,'perfTrace("completed");'+anchor)
# Wrap the probe only; ordinary capture guards still produce an explicit failure.
start=s.index('if(const char* output=std::getenv("GEL_PERF_OUTPUT")){')
end=s.index('\n}\n',start)
s=s[:end]+'''\n }catch(const std::exception& e){
  PerfOriginScope failureOrigin("guard-failure");
  perfTrace("failure",nullptr,0,0,e.what());
  std::ofstream(fs::path(output)/"failure.json")<<Json{{"error",e.what()},{"tick",gPerfTicks}}.dump(2)<<std::endl;
  quit();
 }
'''+s[end:]
f.write_text(s)
f=source/'src/View.cpp';s=f.read_text();s='extern void perfDetach(const void*,const char*);\n'+s
anchor='\tif ( p != parent )\n\t{';assert s.count(anchor)==1
s=s.replace(anchor,anchor+'\n        if(parent && !p)perfDetach(this,getName().c_str());');f.write_text(s)
f=source/'proj/cmake/CMakeLists.txt';f.write_text(f.read_text().replace('GelboxPerformanceInteractionReference','GelboxPerformanceAttributionReference'))
(a.output/'attribution-inputs.json').write_text(json.dumps({'base_source_hashes':expected,'changed_source_hashes':{name:sha(source/name) for name in ['src/GelboxApp.cpp','src/View.cpp','proj/cmake/CMakeLists.txt']},'instrument_sha256':sha(Path(__file__))},indent=2)+'\n')
