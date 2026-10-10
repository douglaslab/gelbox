/** A failed renderer must not masquerade as an empty scientific view. */
export function GraphicsFailure({testId,width,height,onRetry}:{
  testId:string;width:number;height:number;onRetry:()=>void;
}) {
  return <div role="alert" data-testid={testId}
    onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}
    style={{position:'absolute',left:0,top:0,width,height,zIndex:10,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      boxSizing:'border-box',padding:16,gap:12,background:'#fff',color:'#333',
      font:'500 12px/18px Avenir, sans-serif',textAlign:'center',pointerEvents:'auto'}}>
    <strong>Graphics could not start</strong>
    <p style={{margin:0}}>Your gel is still open. Try again, or enable hardware acceleration in your browser.</p>
    <button type="button" onClick={onRetry}
      style={{font:'inherit',padding:'4px 10px',border:'1px solid #999',borderRadius:4,
        background:'#f4f4f4',color:'#222',cursor:'pointer'}}>Retry graphics</button>
  </div>;
}
