"""Compare universal static libraries without treating archive headers as code."""
import argparse,hashlib,json,struct
from pathlib import Path

def digest(data):return hashlib.sha256(data).hexdigest()
def read_library(path):
 data=Path(path).read_bytes()
 magic,count=struct.unpack_from('>II',data)
 assert magic==0xcafebabe, 'Expected a 32-bit universal Mach-O wrapper'
 slices={}
 for i in range(count):
  cpu,sub,offset,size,align=struct.unpack_from('>IIIII',data,8+i*20)
  archive=data[offset:offset+size];assert archive[:8]==b'!<arch>\n'
  cursor=8;members=[]
  while cursor<len(archive):
   header=archive[cursor:cursor+60];assert header[58:60]==b'`\n'
   length=int(header[48:58]);payload=archive[cursor+60:cursor+60+length]
   name=header[:16].decode().strip()
   if name.startswith('#1/'):
    namesize=int(name[3:]);name=payload[:namesize].rstrip(b'\0').decode();payload=payload[namesize:]
   # Keep duplicate basenames in order; a dictionary would silently lose objects.
   members.append({'name':name,'size':len(payload),'sha256':digest(payload)})
   cursor+=60+length+length%2
  assert cursor==len(archive)
  slices[f'{cpu:#x}:{sub}']=members
 return {'sha256':digest(data),'slices':slices}

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('recorded');parser.add_argument('rebuilt');parser.add_argument('--output',required=True);args=parser.parse_args()
 old,new=read_library(args.recorded),read_library(args.rebuilt)
 assert old['slices'].keys()==new['slices'].keys()
 comparisons={}
 for arch,original in old['slices'].items():
  rebuilt=new['slices'][arch]
  assert [x['name'] for x in original]==[x['name'] for x in rebuilt],arch
  mismatches=[{'index':i,'recorded':a,'rebuilt':b} for i,(a,b) in enumerate(zip(original,rebuilt)) if a!=b]
  objects=[x for x in mismatches if not x['recorded']['name'].startswith('__.SYMDEF')]
  comparisons[arch]={'members':len(original),'identical_members':len(original)-len(mismatches),'different_object_members':len(objects),'differences':mismatches}
 report={'recorded':old,'rebuilt':new,'comparison':comparisons}
 Path(args.output).write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({a:{k:v for k,v in r.items() if k!='differences'} for a,r in comparisons.items()},indent=2))
