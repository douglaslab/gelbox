import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertPerformanceBudget} from './performance-budget.mjs';
const fixture=backend=>JSON.parse(readFileSync(new URL(`../../reference/web/performance/native-comparison/${backend}.json`,import.meta.url),'utf8'));
for(const backend of ['webgpu','webgl2'])test(`${backend} recorded workload meets budget`,()=>assert.doesNotThrow(()=>assertPerformanceBudget(fixture(backend))));
for(const [name,mutate] of [
 ['missing all particles',r=>r.baseline.particles=[]],
 ['empty loupe after steady measurement',r=>r.windows[0].end.particles[0].count=0],
 ['missing sample after gesture',r=>r.interaction.end.particles=r.interaction.end.particles.filter(p=>p.view!=='molecular-sim-canvas')],
 ['duplicate loupe identity',r=>r.windows[1].end.particles[1].view='loupe-canvas-1'],
 ['slower steady frames',r=>r.windows[0].intervalMs.p95=27],
 ['steady tail regression',r=>r.windows[1].intervalMs.p99=35],
 ['callback cost regression',r=>r.windows[0].callbackCpuMs.p95=5],
 ['gesture stutter',r=>r.interaction.intervalMs.p95=27],
 ['gesture tail regression',r=>r.interaction.intervalMs.p99=35],
 ['steady resource leak',r=>r.windows[0].end.resources++],
 ['gesture resource leak',r=>r.interaction.end.resources++],
 ['inactive resource ledger',r=>r.baseline.resources=0],
 ['missing timing',r=>delete r.windows[0].intervalMs.p95],
 ['unsupported hardware',r=>r.hardware='Other machine'],
 ['short observation',r=>r.windows[0].samples=20],
 ['different workload',r=>r.fixtureSha256='wrong'],
])test(`rejects ${name}`,()=>{const r=fixture('webgpu');mutate(r);assert.throws(()=>assertPerformanceBudget(r),/Performance budget:/);});
