import json,gzip,collections
from pathlib import Path
r=Path(__file__).resolve().parent
a=json.loads(gzip.decompress((r/'heap-10.heapsnapshot.gz').read_bytes()));b=json.loads(gzip.decompress((r/'heap-30.heapsnapshot.gz').read_bytes()));ns=6;es=3
oldids=set(a['nodes'][2::ns]);n=b['nodes'];e=b['edges'];s=b['strings'];types=b['snapshot']['meta']['node_types'][0];et=b['snapshot']['meta']['edge_types'][0]
parents=collections.defaultdict(list);out=collections.defaultdict(list);at=0
for i in range(0,len(n),ns):
 for j in range(n[i+4]):
  kind=et[e[at]];name=str(e[at+1]) if kind in ('element','hidden') else s[e[at+1]];child=e[at+2];parents[child].append((i,kind,name));out[i].append((child,kind,name));at+=es

def desc(i):return {'index':i,'id':n[i+2],'type':types[n[i]],'name':s[n[i+1]][:140],'bytes':n[i+3]}
added=sorted((i for i in range(0,len(n),ns) if n[i+2] not in oldids and types[n[i]]=='code'),key=lambda i:n[i+3],reverse=True)
for i in added[:8]:
 print('\nNEW',desc(i))
 for p,k,name in parents[i][:5]:
  print(' <-',k,name,desc(p))
  for pp,kk,nn in parents[p][:3]:print('   <-',kk,nn,desc(pp))
print('\nLAYOUT ROOT PATH')
for i in range(0,len(n),ns):
 if s[n[i+1]]=='LayoutShift' and types[n[i]]=='native' and n[i+2] not in oldids:
  seen={i};q=collections.deque([(i,[])]);found=False
  while q and not found:
   x,path=q.popleft()
   for p,k,name in parents[x]:
    if k=='weak' or p in seen:continue
    seen.add(p);npath=path+[(desc(p),k,name)]
    if p==0:print(json.dumps(npath,indent=2));found=True;break
    q.append((p,npath))
  break
print('\nCODE SOURCE OWNERS')
for i in added[:8]:
 for code,kind,ename in parents[i]:
  if ename!='instruction_stream':continue
  for closure,kind,ename in parents[code]:
   if types[n[closure]]!='closure':continue
   print('OWNER',desc(closure),'existingAt10',n[closure+2] in oldids)
   for child,k,name in out[closure]:
    if name=='shared':
     for script,kk,nn in out[child]:
      if nn=='script':
       for v,kkk,nnn in out[script]:
        if nnn=='name': print('SCRIPT',s[n[v+1]][:200])
