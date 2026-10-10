import {it,expect} from 'vitest';
import cases from '../../../reference/native/numerical/image-cases.json';
import outputs from '../../../reference/native/numerical/image-outputs.json';
import {imageGesture,imageResizeBox,imageIntersectsWindow,imageGestureMode} from '../../src/lib/gel/imageGeometry';
const rect=(a:number[])=>({x1:a[0],y1:a[1],x2:a[2],y2:a[3]});
const point=(a:number[])=>({x:a[0],y:a[1]});
for(const [i,c] of cases.entries())it(`native image ${c.id}`,()=>{
 const start=rect(c.frame),down=point(c.down),mode=imageGestureMode(start,down);
 let frame=start,previous=down;
 for(const pos of c.moves){const current=point(pos);frame=mode==='drag'?imageGesture(frame,previous,current,point(c.natural),mode):imageGesture(start,down,current,point(c.natural),mode);previous=current;}
 const expected=outputs[i];expect(expected.id).toBe(c.id);
 Object.values(frame).forEach((v,j)=>expect(v).toBeCloseTo(expected.frame[j],4));
 Object.values(imageResizeBox(frame)).forEach((v,j)=>expect(v).toBeCloseTo(expected.handle[j],4));
 const key='key' in c?c.key:undefined;
 expect(!imageIntersectsWindow(frame,c.window[2],c.window[3])||key==='delete'||key==='backspace').toBe(expected.removed);
});
