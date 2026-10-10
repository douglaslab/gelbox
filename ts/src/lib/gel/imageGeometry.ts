import type {Rect} from '../sim/band';
export interface Point {x:number;y:number}
const f=Math.fround;
const size=(r:Rect):Point=>({x:f(r.x2-r.x1),y:f(r.y2-r.y1)});
const center=(r:Rect):Point=>({x:f(f(r.x1+r.x2)/2),y:f(f(r.y1+r.y2)/2)});
export function imageResizeBox(r:Rect):Rect {return {x1:f(r.x2-16),y1:f(r.y2-16),x2:r.x2,y2:r.y2};}
export function imageGestureMode(r:Rect,p:Point):'drag'|'resize' {
 const h=imageResizeBox(r);return p.x>=h.x1&&p.x<=h.x2&&p.y>=h.y1&&p.y<=h.y2?'resize':'drag';
}
export function imageIntersectsWindow(r:Rect,width:number,height:number):boolean {
 return !(r.x1>width||r.x2<0||r.y1>height||r.y2<0);
}
/** ImageView::mouseDrag + Cinder Rectf::getCenteredFit; round each native float operation. */
export function imageGesture(start:Rect,down:Point,current:Point,natural:Point,mode:'drag'|'resize'):Rect {
 const dx=f(current.x-down.x),dy=f(current.y-down.y);
 if(mode==='drag')return {x1:f(start.x1+dx),y1:f(start.y1+dy),x2:f(start.x2+dx),y2:f(start.y2+dy)};
 const s=size(start),wanted={x:Math.max(32,f(s.x+dx)),y:Math.max(32,f(s.y+dy))};
 const target={x1:start.x1,y1:start.y1,x2:f(start.x1+wanted.x),y2:f(start.y1+wanted.y)};
 const sc=center(start),tc=center(target),offset={x:f(tc.x-sc.x),y:f(tc.y-sc.y)};
 const moved={x1:f(start.x1+offset.x),y1:f(start.y1+offset.y),x2:f(start.x2+offset.x),y2:f(start.y2+offset.y)};
 const ms=size(moved),ts=size(target),mc=center(moved);
 const scale=f(f(f(ms.x/ms.y)/f(ts.x/ts.y))>=1?ts.x/ms.x:ts.y/ms.y);
 const hw=f(f(ms.x*scale)/2),hh=f(f(ms.y*scale)/2);
 let result={x:f(f(mc.x+hw)-f(mc.x-hw)),y:f(f(mc.y+hh)-f(mc.y-hh))};
 const nx=f(result.x-natural.x),ny=f(result.y-natural.y);
 if(f(Math.sqrt(f(f(nx*nx)+f(ny*ny))))<4)result=natural;
 return {x1:start.x1,y1:start.y1,x2:f(start.x1+result.x),y2:f(start.y1+result.y)};
}
