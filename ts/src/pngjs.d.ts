declare module 'pngjs/browser.js' {
 const png:{PNG:{sync:{read:(bytes:Uint8Array,options:{skipRescale:boolean})=>{
  width:number;height:number;depth:number;colorType:number;
  data:Uint8Array|Uint16Array;transColor?:number[];
 }}}};
 export default png;
}
