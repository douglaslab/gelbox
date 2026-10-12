import {decodeReferenceImage} from './imageDecode';
import type {Rect} from '../sim/band';
import type {Point} from './imageGeometry';
export interface ReferenceImage {id:number;bitmap:ImageBitmap;frame:Rect}
export const isReferenceImage=(name:string)=>/\.(jpg|png|gif)$/.test(name);
/** View resources deliberately live outside the serializable gel document. */
export class ReferenceImageStore {
 private entries:ReferenceImage[]=[];
 private listeners=new Set<()=>void>();
 private generation=0;
 private active=true;
 private nextId=1;
 constructor(private decode:(file:File)=>Promise<ImageBitmap> = decodeReferenceImage){}
 getSnapshot=()=>this.entries;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private publish(entries:ReferenceImage[]){this.entries=entries;this.listeners.forEach(fn=>fn());}
 activate(){this.active=true;}
 dispose(){this.active=false;++this.generation;for(const image of this.entries)image.bitmap.close();this.publish([]);}
 async load(file:File,point?:Point){
  if(!this.active)return;
  if(!isReferenceImage(file.name))throw new Error('Unsupported image file');
  const generation=this.generation,bitmap=await this.decode(file);
  if(!this.active||generation!==this.generation){bitmap.close();return;}
  if(!bitmap.width||!bitmap.height){bitmap.close();throw new Error('Image has no pixels');}
  const x=Math.fround(point?point.x-bitmap.width/2:0),y=Math.fround(point?point.y-bitmap.height/2:0);
  this.publish([...this.entries,{id:this.nextId++,bitmap,frame:{x1:x,y1:y,x2:Math.fround(x+bitmap.width),y2:Math.fround(y+bitmap.height)}}]);
 }
 update(id:number,frame:Rect){this.publish(this.entries.map(image=>image.id===id?{...image,frame}:image));}
 remove(id:number){const image=this.entries.find(image=>image.id===id);if(!image)return;image.bitmap.close();this.publish(this.entries.filter(image=>image.id!==id));}
}
