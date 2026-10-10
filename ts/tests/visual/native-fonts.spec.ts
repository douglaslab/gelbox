import {test,expect} from '@playwright/test';
for(const scale of [1,2])test.describe(`native fonts at ${scale}x`,()=>{
 test.use({deviceScaleFactor:scale,viewport:{width:1365,height:800}});
 test('native text uses unadjusted Avenir face metrics',async({page},info)=>{
 test.skip(process.platform!=='darwin','Native Avenir certification requires macOS system fonts');
 await page.addInitScript(b=>localStorage.setItem('gelBackend',b),info.project.name.endsWith('webgl2')?'webgl2':'webgpu');
 await page.goto('/#/gel');await page.getByTestId('settings-button').click();
 const client=await page.context().newCDPSession(page);
 await client.send('DOM.enable');await client.send('CSS.enable');
 const {root}=await client.send('DOM.getDocument');
 const results=[];
 for(const [selector,text,width,face] of [
  ['[data-testid="gel-settings-view"] h2','Gel',38.688,'Avenir-Heavy'],
  ['[data-testid="gel-buffer-view"] h3','Buffer',34.452,'Avenir-Heavy'],
  ['[data-testid="gel-buffer-view-tris"]','44.5 mM',47.784,'Avenir-Medium'],
  ['[data-testid="timeline-slider"]','3:00',23.352,'Avenir-Medium'],
 ] as const){
  const metrics=await page.locator(selector).evaluate((el,text)=>{
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   let node:Node|null;
   while((node=walker.nextNode()))if(node.textContent?.trim()===text){
    const range=document.createRange();range.selectNodeContents(node);
    node.parentElement!.setAttribute('data-font-probe','current');
    const style=getComputedStyle(node.parentElement!);
    return {width:range.getBoundingClientRect().width,adjust:style.fontSizeAdjust,smoothing:style.getPropertyValue('-webkit-font-smoothing'),font:style.font};
   }
   throw new Error('Text node missing');
  },text);
  const probe=await client.send('DOM.querySelector',{nodeId:root.nodeId,selector:'[data-font-probe="current"]'});
  const fonts=await client.send('CSS.getPlatformFontsForNode',{nodeId:probe.nodeId});
  await page.locator('[data-font-probe="current"]').evaluate(el=>el.removeAttribute('data-font-probe'));
  results.push({selector,fonts,metrics,expected:{width,face}});
 }
 await page.screenshot({path:info.outputPath('native-fonts.png')});
 await info.attach('font-metrics',{body:JSON.stringify(results,null,2),contentType:'application/json'});
 for(const result of results){
  expect(result.metrics.adjust).toBe('none');
  expect(result.metrics.smoothing).toBe('auto');
  expect(result.metrics.width).toBeCloseTo(result.expected.width,1);
  expect(result.fonts.fonts.some(font=>font.postScriptName===result.expected.face&&font.glyphCount>0)).toBe(true);
 }
});
});
