import sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from cache_inventory import c,base,segments,struct,json
from unicorn import *
import unicorn.x86_const as xr
from unicorn.x86_const import *
from capstone import Cs,CS_ARCH_X86,CS_MODE_64,CS_OP_REG,CS_OP_MEM
from fractions import Fraction
import ctypes
md=Cs(CS_ARCH_X86,CS_MODE_64);md.detail=True;fma_calls=[]
host=ctypes.CDLL('/usr/lib/libSystem.B.dylib').fma;host.argtypes=[ctypes.c_double]*3;host.restype=ctypes.c_double

def hook(u,_):
 addr=u.reg_read(UC_X86_REG_RIP);ins=next(md.disasm(bytes(u.mem_read(addr,15)),addr))
 if ins.mnemonic not in ['vfmadd213pd','vfmadd231sd']:
  print('unsupported',hex(addr),ins.mnemonic,ins.op_str);return False
 assert u.reg_read(UC_X86_REG_MXCSR)&0x6000==0
 def value(op):
  if op.type==CS_OP_REG:return u.reg_read(getattr(xr,'UC_X86_REG_'+ins.reg_name(op.reg).upper())).to_bytes(16,'little')
  assert op.type==CS_OP_MEM and op.size==16
  def reg(r):
   if not r:return 0
   name=ins.reg_name(r)
   return addr+ins.size if name=='rip' else u.reg_read(getattr(xr,'UC_X86_REG_'+name.upper()))
  at=reg(op.mem.base)+reg(op.mem.index)*op.mem.scale+op.mem.disp
  return bytes(u.mem_read(at,16))
 a,b,d=[struct.unpack('<2d',value(op)) for op in ins.operands]
 out=[]
 terms=zip(a,b,d) if ins.mnemonic=='vfmadd213pd' else [(b[0],d[0],a[0])]
 for av,bv,dv in terms:
  assert all(map(math.isfinite,[av,bv,dv]))
  result=float(Fraction(av)*Fraction(bv)+Fraction(dv));assert math.isfinite(result) and result!=0
  assert struct.pack('<d',result)==struct.pack('<d',host(av,bv,dv))
  out.append(result);fma_calls.append([av,bv,dv,result])
 if ins.mnemonic.endswith('sd'):out.append(a[1])
 u.reg_write(getattr(xr,'UC_X86_REG_'+ins.reg_name(ins.operands[0].reg).upper().replace('XMM','YMM')),int.from_bytes(struct.pack('<2d',*out),'little'));u.reg_write(UC_X86_REG_RIP,addr+ins.size)
 return True
source=open(Path(__file__).with_name('pow_probe.py')).read();source=source[:source.index('results=[]')]
exec(source)
u.hook_add(UC_HOOK_INSN_INVALID,hook)
print(json.dumps({'variants':[{'address':hex(addr),'result':run(addr,.7859917879104614,3.700000047683716)} for addr in variants],'fusedOperations':fma_calls},indent=2))
