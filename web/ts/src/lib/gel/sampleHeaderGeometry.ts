import type {Mesh} from './mesh';
/** Cinder drawSolidCircle: 125 segments for radius 20, float arithmetic. */
const f=Math.fround,radius=20,segments=Math.floor(radius*Math.PI*2);
const delta=f(f(f(1/segments)*2)*f(Math.PI));
const center=[20,-31],color=[161/255,214/255,1,1];
const edge=(i:number)=>{
 const angle=f(i*delta);
 return [f(center[0]+f(f(Math.cos(angle))*radius)),f(center[1]+f(f(Math.sin(angle))*radius))];
};
const data:number[]=[];
for(let i=0;i<segments;i++)for(const point of [center,edge(i),edge(i+1)])data.push(...point,...color);
export const sampleHeaderCircle:Mesh={data:new Float32Array(data),vertexCount:segments*3};
