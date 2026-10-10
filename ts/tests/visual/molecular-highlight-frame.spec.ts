import {test,expect} from '@playwright/test';

test('a stationary-pointer crossing reaches the molecular draw in the same frame',async({page},info)=>{
  await page.addInitScript(backend=>localStorage.setItem('gelBackend',backend),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
  // Observe the real mesh boundary without exposing production test hooks.
  await page.route('**/src/lib/sim/molecularSimMesh.ts*',async route=>{
    const response=await route.fetch(),body=await response.text();
    expect(body).toContain('const verts = [];');
    await route.fulfill({response,body:body.replace('const verts = [];',
      'globalThis.__observeHighlight?.(parts, rolloverFragment); const verts = [];')});
  });
  await page.goto('/#/gel');
  await page.evaluate(async()=>{
    const path='/src/lib/sim/molecularSimEngine.ts';
    const {MolecularSim}=await import(/* @vite-ignore */path);
    const w=window as any;
    w.__molsimFreezeAfterTicks=90;
    w.__draws=[];w.__picked=new WeakMap();
    w.__observeHighlight=(parts:any,rollover:any)=>{
      if(w.__cross&&w.__picked.has(parts))w.__draws.push({picked:w.__picked.get(parts),rollover});
    };
    const pick=MolecularSim.prototype.pickFragment;
    MolecularSim.prototype.pickFragment=function(x:number,y:number) {
      // Move a real rendered particle under a stationary pointer at the next
      // per-frame pick. The engine's actual geometry performs the hit test.
      if(w.__cross) {
        for(const part of this.parts)part.loc={x:-1000,y:-1000};
        const part=this.parts.find((p:any)=>p.fragment===1&&p.alive);
        if(!part)throw new Error('No crossing species');
        part.loc={x,y};part.fade=1;
      }
      const result=pick.call(this,x,y);w.__picked.set(this.parts,result);return result;
    };
  });
  await page.getByTestId('microtube-0').click();
  const canvas=page.getByTestId('molecular-sim-canvas');
  await expect(canvas).toHaveAttribute('data-frozen','1');
  await canvas.hover({position:{x:180,y:260}});
  await page.evaluate(()=>{(window as any).__cross=true;});
  await expect.poll(()=>page.evaluate(()=>(window as any).__draws.length)).toBeGreaterThan(0);
  const first=await page.evaluate(()=>(window as any).__draws[0]);
  expect(first.picked).toBe(1);
  expect(first.rollover).toBe(1);
});
