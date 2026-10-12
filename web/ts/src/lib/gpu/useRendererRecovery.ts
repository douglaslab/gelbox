import {useCallback,useRef,useState} from 'react';
import type {Backend} from '../gel/backend';

/** Each recovery cycle tries both full renderers at most once, on distinct canvases. */
export function useRendererRecovery() {
  const [failed,setFailed]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const [forcedBackend,setForcedBackend]=useState<Backend|null>(null);
  const rejected=useRef(new Set<Backend>());
  const onFailure=useCallback((backend:Backend|null)=>{
    if(backend){
      rejected.current.add(backend);
      const other=backend==='webgpu'?'webgl2':'webgpu';
      if(!rejected.current.has(other)){
        setForcedBackend(other);setAttempt(n=>n+1);return;
      }
    }
    setFailed(true);
  },[]);
  const onLoss=useCallback((backend:Backend)=>{
    rejected.current.clear();onFailure(backend);
  },[onFailure]);
  const onSuccess=useCallback(()=>setFailed(false),[]);
  const onRetry=useCallback(()=>{
    rejected.current.clear();setFailed(false);setForcedBackend(null);setAttempt(n=>n+1);
  },[]);
  return {failed,attempt,forcedBackend,onFailure,onLoss,onSuccess,onRetry};
}
