export type Point = {x:number;y:number};
/** SampleView::updateCallout: convex hull of the four frame corners and anchor. */
export function loupeHull(frame:Point,anchor:Point,size=171):Point[] {
 const points=[frame,{x:frame.x+size,y:frame.y},{x:frame.x+size,y:frame.y+size},{x:frame.x,y:frame.y+size},anchor].sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const half=(ps:Point[])=>{const hull:Point[]=[];for(const p of ps){while(hull.length>1&&cross(hull[hull.length-2],hull[hull.length-1],p)<=0)hull.pop();hull.push(p);}return hull.slice(0,-1);};
 return [...half(points),...half([...points].reverse())];
}
