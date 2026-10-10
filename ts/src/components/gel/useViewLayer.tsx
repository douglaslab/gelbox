import {createContext,useCallback,useContext,useLayoutEffect,useMemo,useState,type ReactNode} from 'react';
import {insertView,removeView,raiseView} from '../../lib/gel/viewOrder';
interface ViewOrder {order:string[];add:(key:string,above?:string)=>void;remove:(key:string)=>void;raise:(key:string)=>void}
const Context=createContext<ViewOrder|null>(null);
export function ViewOrderProvider({children}:{children:ReactNode}){
 const [order,setOrder]=useState(['gel','app-button','help-button']);
 const add=useCallback((key:string,above?:string)=>setOrder(v=>insertView(v,key,above)),[]);
 const remove=useCallback((key:string)=>setOrder(v=>removeView(v,key)),[]);
 const raise=useCallback((key:string)=>setOrder(v=>raiseView(v,key)),[]);
 const value=useMemo(()=>({order,add,remove,raise}),[order,add,remove,raise]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
function useOrder(){const order=useContext(Context);if(!order)throw new Error('Missing view order provider');return order;}
export function useViewZIndex(key:string){return 30+useOrder().order.indexOf(key);}
export function useViewLayer(key:string,above?:string){
 const {order,add,remove,raise}=useOrder();
 useLayoutEffect(()=>{add(key,above);return()=>remove(key);},[key,above,add,remove]);
 return {zIndex:30+order.indexOf(key),raise:()=>raise(key)};
}
