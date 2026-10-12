/** Hardware-specific regression gate; not a cross-platform FPS promise. */
export const budget = Object.freeze({profile:'m5-max',steadyP95Ms:26,steadyP99Ms:34,callbackP95Ms:4,gestureP95Ms:26,gestureP99Ms:34,resourceGrowth:0});
export function assertPerformanceBudget(report) {
 const require=(ok,message)=>{if(!ok)throw new Error(`Performance budget: ${message}`);};
 const bounded=(value,limit,name)=>require(Number.isFinite(value)&&value>=0&&value<=limit,`${name}: ${value} exceeds ${limit} or is invalid`);
 require(report.hardware==='Mac17,14\nApple M5 Max'&&report.os==='27.0.1','unsupported hardware/OS profile');
 require(['webgpu','webgl2'].includes(report.backend),'unknown backend');
 require(report.viewport?.width===1365&&report.viewport?.height===768&&report.viewport?.dpr===2,'wrong viewport');
 require(report.fixtureSha256==='9837e59e56953d4a441b7032bdf89a6a78510047097c359ee4cead1cc2a39598','wrong workload fixture');
 require(report.warmupSeconds>=3&&report.windowSeconds>=10&&report.windows?.length===2,'insufficient steady measurement');
 const workload=snapshot=>{
  const views=['molecular-sim-canvas','loupe-canvas-1','loupe-canvas-2','loupe-canvas-3'];
  for(const view of views){
   const matches=snapshot?.particles?.filter(p=>p.view===view)??[];
   require(matches.length===1&&Number.isInteger(matches[0].count)&&matches[0].count>0,`missing or empty particle view: ${view}`);
  }
 };
 workload(report.baseline);
 const base=report.baseline?.resources;
 require(Number.isInteger(base)&&base>0,'resource tracking inactive');
 for(const [i,window] of report.windows.entries()){
  workload(window.end);
  require(window.samples>=500,'insufficient frame samples');
  bounded(window.intervalMs?.p95,budget.steadyP95Ms,`window ${i} interval p95`);
  bounded(window.intervalMs?.p99,budget.steadyP99Ms,`window ${i} interval p99`);
  bounded(window.callbackCpuMs?.p95,budget.callbackP95Ms,`window ${i} callback p95`);
  require(window.end?.resources===base,`window ${i} resource growth`);
 }
 workload(report.interaction?.end);
 require(report.interaction?.pointerMoves===60&&report.interaction.frameSamples>=30,'missing gesture measurement');
 bounded(report.interaction.intervalMs?.p95,budget.gestureP95Ms,'gesture interval p95');
 bounded(report.interaction.intervalMs?.p99,budget.gestureP99Ms,'gesture interval p99');
 require(report.interaction.end?.resources===base,'gesture resource growth');
 return budget;
}
