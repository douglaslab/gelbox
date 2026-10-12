import struct,pathlib,mmap,json
ROOT=pathlib.Path('/System/Volumes/Preboot/Cryptexes/Rosetta/System/Library/dyld')
class Cache:
 def __init__(self):
  self.maps=[];self.files=[]
  for p in sorted(ROOT.glob('dyld_shared_cache_x86_64*')):
   if p.suffix not in ['', '.01','.02','.03','.04','.05','.06']:continue
   f=p.open('rb');mm=mmap.mmap(f.fileno(),0,access=mmap.ACCESS_READ);self.files.append((f,mm));off,n=struct.unpack_from('<II',mm,16)
   for i in range(n):
    addr,size,offset,prot,init=struct.unpack_from('<QQQII',mm,off+i*32);self.maps.append((addr,size,offset,mm,p.name))
 def read(self,addr,size):
  for base,n,off,mm,name in self.maps:
   if base<=addr and addr+size<=base+n:return mm[off+addr-base:off+addr-base+size]
  raise Exception(f'Unmapped {addr:x}+{size:x}')
c=Cache();base=0x7ff81481c000;header=c.read(base,16384);n=struct.unpack_from('<I',header,16)[0];pos=32;segments=[];exports=None
for _ in range(n):
 cmd,size=struct.unpack_from('<II',header,pos)
 if cmd==0x19:
  name,va,sz,off,fsz=struct.unpack_from('<16sQQQQ',header,pos+8);segments.append((name.rstrip(b'\0').decode(),va,sz,off,fsz))
 if cmd==0x80000033:exports=struct.unpack_from('<II',header,pos+8)
 if cmd==0x80000022:exports=struct.unpack_from('<II',header,pos+40)
 pos+=size
link=next(s for s in segments if s[0]=='__LINKEDIT');trie=c.read(link[1]+exports[0]-link[3],exports[1]);symbols={}
def uleb(b,p):
 v=0;shift=0
 while True:
  x=b[p];p+=1;v|=(x&127)<<shift
  if not x&128:return v,p
  shift+=7

def walk(pos,name):
 terminal,p=uleb(trie,pos);end=p+terminal
 if terminal:
  flags,q=uleb(trie,p);val,q=uleb(trie,q);symbols[name]={'flags':flags,'address':hex(base+val),'terminal':trie[p:end].hex()}
 children=trie[end];p=end+1
 for _ in range(children):
  stop=trie.index(0,p);edge=trie[p:stop].decode();child,p=uleb(trie,stop+1);walk(child,name+edge)
walk(0,'')
if __name__=='__main__':
 print(json.dumps({'segments':segments,'exports':exports,'powf':symbols.get('_powf')},indent=2))
