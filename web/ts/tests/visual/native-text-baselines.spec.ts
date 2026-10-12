import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`native text baselines ${scale}x`,()=>{
test.use({viewport:{width:1365,height:768},deviceScaleFactor:scale});
test('slider and buffer labels use native baseline coordinates',async({page},info)=>{
 test.skip(process.platform!=='darwin','Reference requires system Avenir');
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await page.getByTestId('settings-button').click();
 const results=[];
 for(const [id,text] of [['gel-buffer-view-tris','44.5 mM'],['gel-voltage','70 V'],['timeline-slider','3:00']]){
  results.push(await page.getByTestId(id).evaluate((root,text)=>{
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n:Node|null;
   while((n=walker.nextNode()))if(n.textContent===text){
    const parent=n.parentElement!,probe=document.createElement('span');
    probe.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline';
    parent.append(probe);const baseline=probe.getBoundingClientRect().y;
    const range=document.createRange();range.selectNodeContents(n);
    const box=range.getBoundingClientRect().toJSON(),style=getComputedStyle(parent);
    probe.remove();return {id:root.getAttribute('data-testid'),text,baseline,box,font:style.font};
   }
   throw Error('missing text');
  },text));
 }
 await page.screenshot({path:info.outputPath(`text-baselines-${scale}x.png`)});
 await info.attach('baselines',{body:JSON.stringify(results,null,2),contentType:'application/json'});
 expect(results.map(r=>r.baseline)).toEqual([195,520,698]);
});
});
