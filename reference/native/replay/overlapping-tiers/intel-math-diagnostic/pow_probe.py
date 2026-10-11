from cache_inventory import c,base,segments,struct,json
from unicorn import Uc,UC_ARCH_X86,UC_MODE_64
from unicorn.x86_const import *
import hashlib
variants=[0x7ff81481de35+0x152ab,0x7ff81481de3e+0x14ff2]
u=Uc(UC_ARCH_X86,UC_MODE_64);u.ctl_set_cpu_model(UC_CPU_X86_HASWELL);text=c.read(base,segments[0][2]);assert hashlib.sha256(text).hexdigest()=='a3d8e089d458c338ecc5d08207d5b6b4b8c04be4a4c7347d9d7e951e42a6e61e';u.mem_map(base,(len(text)+4095)&~4095);u.mem_write(base,text);u.mem_map(0x200000000,0x20000);u.mem_map(0x300000000,0x1000)
u.reg_write(UC_X86_REG_CR4,u.reg_read(UC_X86_REG_CR4)|(1<<18))
u.mem_write(0x300000100,bytes.fromhex('0f01d1'))
u.reg_write(UC_X86_REG_EAX,7);u.reg_write(UC_X86_REG_ECX,0);u.reg_write(UC_X86_REG_EDX,0)
u.emu_start(0x300000100,0x300000103,count=1)
def run(addr,a,b):
 sp=0x200018008;u.mem_write(sp,struct.pack('<Q',0x300000000));u.reg_write(UC_X86_REG_RSP,sp);u.reg_write(UC_X86_REG_MXCSR,0x1f80)
 for reg,val in [(UC_X86_REG_XMM0,a),(UC_X86_REG_XMM1,b)]:u.reg_write(reg,int.from_bytes(struct.pack('<f',val),'little'))
 u.emu_start(addr,0x300000000,count=10000)
 assert u.reg_read(UC_X86_REG_RIP)==0x300000000
 return struct.unpack('<f',(u.reg_read(UC_X86_REG_XMM0)&0xffffffff).to_bytes(4,'little'))[0]
results=[]
for addr in variants:
 try:result=run(addr,.7859917879104614,3.700000047683716)
 except Exception as error:result={'error':str(error),'rip':hex(u.reg_read(UC_X86_REG_RIP))}
 results.append({'address':hex(addr),'result':result})
print(json.dumps({'textSha256':hashlib.sha256(text).hexdigest(),'variants':results},indent=2))
