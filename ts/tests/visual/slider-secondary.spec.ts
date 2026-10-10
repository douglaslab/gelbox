import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {openSampleSettings} from './sample-helpers';
for(const shared of [false,true])for(const button of ['right','middle'] as const)test(`shared=${shared} ${button} graph and dye bar editing retain native values`,async({page},info)=>{
 await page.addInitScript(({backend,shared})=>{localStorage.setItem('gelBackend',backend);localStorage.setItem('gelSharedPresentation',shared?'1':'0');},{backend:info.project.name.endsWith('webgl2')?'webgl2':'webgpu',shared});
 await page.setViewportSize({width:1365,height:800});await page.goto('/#/gel');await page.getByTestId('band-0').click();await page.mouse.move(0,0);
 await page.getByTestId('frag-aggregate-icon-lo').click();
 const graph=(await page.getByTestId('frag-aggregate-col-0').locator('..').boundingBox())!;
 await page.mouse.move(graph.x+graph.width*2.5/7,graph.y+graph.height*.5);await page.mouse.down({button});
 await page.mouse.move(graph.x+graph.width*4.5/7,graph.y+graph.height*.25);await page.mouse.up({button});
 const save=async()=>{await page.getByRole('button',{name:'Application settings'}).click();const pending=page.waitForEvent('download');await page.getByTestId('save-sample-btn').click();return JSON.parse(await readFile((await(await pending).path())!,'utf8')).Sample;};
 // The 16px graph snaps a point four pixels from the high endpoint to 1.
 expect((await save()).Fragments[0].Aggregate).toEqual([1,0,.5,0,1,0,0]);
 await page.getByTestId('frag-aggregate-icon-hi').click({button});
 expect((await save()).Fragments[0].Aggregate).toEqual([0,0,0,0,0,0,1]);
 await openSampleSettings(page);
 const slider=page.getByTestId('dye-row-0-slider');
 await page.getByTestId('dye-row-0-slider-icon-hi').click({button});await expect(slider).toContainText('125 mM');
 await page.getByTestId('dye-row-0-slider-icon-lo').click({button});await expect(slider).toContainText('0 mM');
 const bar=(await page.getByTestId('dye-row-0-slider-track').boundingBox())!;
 await page.mouse.move(bar.x+bar.width/4,bar.y+bar.height/2);await page.mouse.down({button});await expect(slider).toContainText('31 mM');
 await page.mouse.move(bar.x+bar.width*3/4,bar.y+bar.height/2);await page.mouse.up({button});await expect(slider).toContainText('94 mM');
 expect((await save()).Fragments.find((f:any)=>f.Dye==='Xylene cyanol').Mass).toBe(94);
});
