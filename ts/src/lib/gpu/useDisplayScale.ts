import {useEffect,useState} from 'react';

/** Follow live monitor/browser scale changes even when CSS dimensions stay fixed. */
export function useDisplayScale():number {
  const [scale,setScale]=useState(()=>window.devicePixelRatio||1);
  useEffect(()=>{
    let resolution:MediaQueryList;
    let observed=window.devicePixelRatio||1;
    const update=()=>{
      resolution?.removeEventListener('change',update);
      observed=window.devicePixelRatio||1;setScale(observed);
      resolution=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener('change',update);
    };
    update();window.addEventListener('resize',update);
    // Some display/emulation changes update DPR without either event. Match
    // molecular canvases' frame-time scale check without updating React each frame.
    let frame:number;
    const check=()=>{if((window.devicePixelRatio||1)!==observed)update();frame=requestAnimationFrame(check);};
    frame=requestAnimationFrame(check);
    return()=>{cancelAnimationFrame(frame);resolution.removeEventListener('change',update);window.removeEventListener('resize',update);};
  },[]);
  return scale;
}
