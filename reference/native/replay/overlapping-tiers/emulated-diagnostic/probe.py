import struct, ctypes, json, pathlib, hashlib, os
from unicorn import Uc, UC_ARCH_X86, UC_MODE_64, UC_HOOK_CODE
from unicorn.x86_const import *
ROOT=pathlib.Path(os.environ.get('GEL_REPO', pathlib.Path.cwd()))
EXE=pathlib.Path(os.environ.get('GEL_ORIGINAL_EXE', '/Applications/Gelbox.app/Contents/MacOS/Gelbox'))
f=lambda x:struct.unpack('<f',struct.pack('<f',x))[0]
class Geometry:
 def __init__(self):
  blob=EXE.read_bytes(); self.sha=hashlib.sha256(blob).hexdigest()
  assert self.sha=='037514b74bd7fcb673b7a276749fd31bfeabc0773fd11b790457412e905a78a7', 'Probe addresses only support the qualified original executable'
  self.u=Uc(UC_ARCH_X86,UC_MODE_64); u=self.u; p=32
  for _ in range(struct.unpack_from('<I',blob,16)[0]):
   cmd,size=struct.unpack_from('<II',blob,p)
   if cmd==0x19:
    name,addr,n,off,sz=struct.unpack_from('<16sQQQQ',blob,p+8)
    if addr and n:
     u.mem_map(addr,(n+4095)&~4095)
     if sz:u.mem_write(addr,blob[off:off+sz])
   p+=size
  u.mem_map(0x200000000,0x20000); u.mem_map(0x300000000,0x1000)
  self.pow=ctypes.CDLL('/usr/lib/libSystem.B.dylib').powf
  self.pow.argtypes=[ctypes.c_float,ctypes.c_float];self.pow.restype=ctypes.c_float
  u.hook_add(UC_HOOK_CODE,self.external,begin=0x1001b3130,end=0x1001b3130)
  u.hook_add(UC_HOOK_CODE,self.external,begin=0x1001b360a,end=0x1001b360a)
  for off,value in [(0x1c,3.7),(0x20,.05),(0x24,.07),(0x28,.06),(0x4c,70),(0x5c,16),(0x10,6)]:u.mem_write(0x1002490d0+off,struct.pack('<f',value))
  u.mem_write(0x1002490d4,struct.pack('<i',14000))
 def external(self,u,addr,size,data):
  if addr==0x1001b360a:
   a,b=[struct.unpack('<f',(u.reg_read(r)&0xffffffff).to_bytes(4,'little'))[0] for r in [UC_X86_REG_XMM0,UC_X86_REG_XMM1]]
   result=self.pow(a,b);self.pow_calls.append({'base':a,'exponent':b,'result':result})
   u.reg_write(UC_X86_REG_XMM0,int.from_bytes(struct.pack('<f',result),'little'))
  else:
   rect=u.reg_read(UC_X86_REG_RDI); v=u.reg_read(UC_X86_REG_RSI)
   x1,y1,x2,y2=struct.unpack('<4f',u.mem_read(rect,16)); x,y=struct.unpack('<2f',u.mem_read(v,8))
   u.mem_write(rect,struct.pack('<4f',f(x1-x),f(y1-y),f(x2+x),f(y2+y)))
  sp=u.reg_read(UC_X86_REG_RSP); ret=struct.unpack('<Q',u.mem_read(sp,8))[0]
  u.reg_write(UC_X86_REG_RSP,sp+8);u.reg_write(UC_X86_REG_RIP,ret)
 def run(self,bases,aggregate,aspect,ctx,well,degradeLo=0,degradeHi=0):
  self.pow_calls=[]
  u=self.u; inp=0x200000100;out=0x200000300;sp=0x200018008
  b=bytearray(256);struct.pack_into('<4i',b,12,bases,aggregate,degradeLo,degradeHi);struct.pack_into('<f',b,32,aspect)
  u.mem_write(inp,bytes(b));u.mem_write(out,bytes(256))
  def buf(b):return [b[k] for k in ['tris','borate','acetate','edta']]
  context=[ctx[k] for k in ['voltage','time','ySpaceScale','wellDamage']]+buf(ctx['gelBuffer'])+buf(ctx['sampleBuffer'])
  u.mem_write(sp,struct.pack('<Q12f',0x300000000,*context))
  for r,val in [(UC_X86_REG_RSP,sp),(UC_X86_REG_RDI,out),(UC_X86_REG_RSI,inp),(UC_X86_REG_MXCSR,0x1f80),(UC_X86_REG_EFLAGS,2)]:u.reg_write(r,val)
  for r,vals in [(UC_X86_REG_XMM0,[well['x1'],well['y1']]),(UC_X86_REG_XMM1,[well['x2'],well['y2']]),(UC_X86_REG_XMM2,[1.5])]:u.reg_write(r,int.from_bytes(struct.pack('<'+'f'*len(vals),*vals),'little'))
  u.emu_start(0x1000572f0,0x300000000,count=10000)
  assert u.reg_read(UC_X86_REG_RIP)==0x300000000
  return list(struct.unpack('<4f',u.mem_read(out+48,16)))
 def solve(self,c,target,aggregate):
  bases,step,direction,left=1,1000,1,50;frag=c['sample']['fragments'][c['fragment']]
  assert frag['degrade']==0
  while True:
   y=int(self.run(bases,aggregate,frag['aspectRatio'],c['ctx'],c['wellRect'],degradeLo=1,degradeHi=1)[1])
   if y==int(target):return bases
   if (y>target and direction!=1) or (y<target and direction!=-1):
    direction*=-1;step=int(step/4)
    if step<=1:break
   bases+=step*direction
   if left<=0:break
   left-=1
  return max(1,min(14000,bases))
if __name__=='__main__':
 g=Geometry();cases=json.loads((ROOT/'reference/native/numerical/cases.json').read_text()); comparison=json.loads((ROOT/'reference/native/replay/overlapping-tiers/candidate/solver-comparison.json').read_text())
 result=[]
 for m in comparison['mismatches']:
  c=next(c for c in cases if c['id']==m['id']);result.append(dict(m,emulated=g.solve(c,m['target'],m['aggregate'])))
 controls=[]
 for m in comparison['mismatches']:
  c=next(c for c in cases if c['id']==m['id']);bases=m['fast'];frag=c['sample']['fragments'][c['fragment']]
  rect=g.run(bases,m['aggregate'],frag['aspectRatio'],c['ctx'],c['wellRect'],degradeLo=1,degradeHi=1)
  controls.append({'id':m['id'],'aggregate':m['aggregate'],'bases':bases,'rect':rect,'powCalls':g.pow_calls})
 print(json.dumps({'controls':controls,'binarySHA256':g.sha,'limitation':'Original geometry instructions; host arm64 powf and source-equivalent Rectf inflation hooks; solver source translation. Not original GUI evidence.','results':result},indent=2))
