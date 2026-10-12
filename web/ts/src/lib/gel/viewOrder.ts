/** Native ViewCollection insertion order; focusing alone does not raise a view. */
export function insertView(order:string[],key:string,above?:string):string[]{
 if(order.includes(key))return order;
 const index=above===undefined?-1:order.indexOf(above);
 return index<0?[...order,key]:[...order.slice(0,index+1),key,...order.slice(index+1)];
}
export function removeView(order:string[],key:string):string[]{return order.includes(key)?order.filter(v=>v!==key):order;}
export function raiseView(order:string[],key:string):string[]{return !order.includes(key)||order.at(-1)===key?order:[...order.filter(v=>v!==key),key];}
