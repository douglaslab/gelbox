"""Independent hand-encoded PNG rows to cover straight-alpha upload formats."""
from pathlib import Path
import struct,zlib,subprocess,json,hashlib,argparse
parser=argparse.ArgumentParser();parser.add_argument("--decoder",required=True);args=parser.parse_args()
root=Path(__file__).resolve().parent
(root/'inputs').mkdir(exist_ok=True);(root/'decoded').mkdir(exist_ok=True)
def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data))
def make(name,depth,color,rows,extra=b''):
 width,height=7,3
 raw=b''.join(b'\x00'+row for row in rows)
 png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,depth,color,0,0,0))+extra+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
 (root/'inputs'/name).write_bytes(png)
 channels={0:1,2:3,3:1,4:2,6:4}[color]
 bits=[ ''.join(format(b,'08b') for b in row)[:width*channels*depth] for row in rows]
 passes=[]
 for x0,y0,dx,dy in [(0,0,8,8),(4,0,8,8),(0,4,4,8),(2,0,4,4),(0,2,2,4),(1,0,2,2),(0,1,1,2)]:
  if x0>=width or y0>=height:continue
  for y in range(y0,height,dy):
   line=''.join(bits[y][x*channels*depth:(x+1)*channels*depth] for x in range(x0,width,dx));line+='0'*((-len(line))%8)
   passes.append(b'\x00'+bytes(int(line[i:i+8],2) for i in range(0,len(line),8)))
 interlaced=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,depth,color,0,0,1))+extra+chunk(b'IDAT',zlib.compress(b''.join(passes)))+chunk(b'IEND',b'')
 (root/'inputs'/('adam7-'+name)).write_bytes(interlaced)
for depth in [1,2,4,8,16]:
 maxval=(1<<depth)-1
 def pack(vals):
  if depth==16:return b''.join(struct.pack('>H',v) for v in vals)
  if depth==8:return bytes(vals)
  bits=''.join(format(v,f'0{depth}b') for v in vals);bits+='0'*((-len(bits))%8)
  return bytes(int(bits[i:i+8],2) for i in range(0,len(bits),8))
 rows=[pack([(x+y)% (maxval+1) for x in range(7)]) for y in range(3)]
 make(f'gray-{depth}.png',depth,0,rows)
 make(f'gray-trns-{depth}.png',depth,0,rows,chunk(b'tRNS',struct.pack('>H',1)))
 if depth<=8:
  count=min(1<<depth,8);rows=[pack([(x+y)%count for x in range(7)]) for y in range(3)]
  make(f'palette-{depth}.png',depth,3,rows,chunk(b'PLTE',bytes(v for i in range(count) for v in [(i*71+20)%256,(i*37+10)%256,(i*19+100)%256]))+chunk(b'tRNS',bytes((i*63)%256 for i in range(count))))
 if depth>=8:
  for channels,color in [(2,4),(3,2),(4,6)]:
   rows=[pack([((x*151+y*29+c*73)*(1 if depth==8 else 137))%(maxval+1) if c!=channels-1 or channels==3 else [0,maxval//3,maxval][x%3] for x in range(7) for c in range(channels)]) for y in range(3)]
   make(f'channels-{channels}-{depth}.png',depth,color,rows)
   if channels==3:make(f'rgb-trns-{depth}.png',depth,color,rows,chunk(b'tRNS',struct.pack('>HHH',0,(73*(1 if depth==8 else 137))%(maxval+1),(146*(1 if depth==8 else 137))%(maxval+1))))
records=[]
for p in sorted((root/'inputs').glob('*.png')):
 out=root/'decoded'/(p.name+'.rgba')
 r=subprocess.run([args.decoder,str(p),str(out)],capture_output=True,text=True)
 record={'file':p.name,'exit':r.returncode,'stderr':r.stderr,'input_sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 if r.returncode==0:record.update(json.loads(r.stdout));record['rgba_sha256']=hashlib.sha256(out.read_bytes()).hexdigest()
 records.append(record)
(root/'native.json').write_text(json.dumps(records,indent=2)+'\n')
