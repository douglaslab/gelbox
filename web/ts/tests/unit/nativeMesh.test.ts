import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {buildMoleculesMesh} from '../../src/lib/sim/molecularSimMesh';
const cases=JSON.parse(readFileSync('../reference/native/numerical/mesh-cases.json','utf8'));
const refs=JSON.parse(readFileSync('../reference/native/numerical/mesh-outputs.json','utf8'));
const tuning={numCirclePartVertices:32,multimerAdhereOverlapFrac:.1,outlineWidth:4,selectColor:[0,0,0] as const,hoverColor:[1,1,0] as const};
function measures(data:ArrayLike<number>) {
 const groups=new Map<string,{area:number;cx:number;cy:number;bounds:number[]}>();
 for(let i=0;i<data.length;i+=18){
  const key=Array.from({length:4},(_,k)=>Math.fround(data[i+2+k])).join(',');
  const a=[data[i],data[i+1]],b=[data[i+6],data[i+7]],c=[data[i+12],data[i+13]];
  const area=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
  if(area<1e-10)continue;
  const g=groups.get(key)??{area:0,cx:0,cy:0,bounds:[Infinity,Infinity,-Infinity,-Infinity]};
  g.area+=area;g.cx+=area*(a[0]+b[0]+c[0])/3;g.cy+=area*(a[1]+b[1]+c[1])/3;
  for(const p of [a,b,c]){g.bounds[0]=Math.min(g.bounds[0],p[0]);g.bounds[1]=Math.min(g.bounds[1],p[1]);g.bounds[2]=Math.max(g.bounds[2],p[0]);g.bounds[3]=Math.max(g.bounds[3],p[1]);}
  groups.set(key,g);
 }
 return [...groups].map(([color,g])=>({color,values:[g.area,g.cx/g.area,g.cy/g.area,...g.bounds]}));
}
function coverage(data:ArrayLike<number>,x:number,y:number):string[]|null {
 const hits:string[]=[];
 for(let i=0;i<data.length;i+=18) {
  const ax=data[i],ay=data[i+1],bx=data[i+6],by=data[i+7],cx=data[i+12],cy=data[i+13];
  const det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
  if(Math.abs(det)<1e-10)continue;
  const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/det;
  const v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/det,w=1-u-v;
  if(Math.min(u,v,w)<-1e-6)continue;
  if(Math.min(u,v,w)<1e-6)return null; // numerical edge, covered separately by bounds/area
  hits.push(Array.from({length:4},(_,k)=>Math.fround(data[i+2+k])).join(','));
 }
 return hits;
}
it.each(cases.map((c:any,i:number)=>[c.id,c,refs[i]]))('native particle mesh coverage: %s',(_id,c,ref)=>{
 expect(c.id).toBe(ref.id);
 const mesh=buildMoleculesMesh([c.part],c.selected?0:null,c.rollover?0:null,tuning);
 expect(Array.from(mesh.data).every(Number.isFinite)).toBe(true);
 const actual=measures(mesh.data),expected=measures(ref.data);
 expect(actual.map(g=>g.color)).toEqual(expected.map(g=>g.color));
 const bounds=expected.map(g=>g.values.slice(3));
 if(bounds.length) {
  const loX=Math.min(...bounds.map(b=>b[0]))-1,loY=Math.min(...bounds.map(b=>b[1]))-1;
  const hiX=Math.max(...bounds.map(b=>b[2]))+1,hiY=Math.max(...bounds.map(b=>b[3]))+1;
  for(let ix=0;ix<19;ix++)for(let iy=0;iy<19;iy++) {
   const x=loX+(hiX-loX)*(ix+.372)/19,y=loY+(hiY-loY)*(iy+.619)/19;
   const a=coverage(mesh.data,x,y),b=coverage(ref.data,x,y);
   if(a!==null&&b!==null)expect(a,`coverage at ${x},${y}`).toEqual(b);
  }
 }
 expected.forEach((g,i)=>g.values.forEach((value,j)=>{
  expect(Math.abs(actual[i].values[j]-value),`group${i} metric${j}: web${actual[i].values[j]} native${value}`).toBeLessThanOrEqual(Math.max(.0002,Math.abs(value)*.00001));
 }));
});
