import {expect,it} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
it('ships captured native Buffer text, metrics and molecule assets unchanged',()=>{
 const root='../reference/native/modern/shared-buffer-scenes/';
 const metrics=JSON.parse(readFileSync(root+'metrics.json','utf8'));
 expect(readFileSync('src/lib/layout/nativeBufferText.json')).toEqual(readFileSync(root+'metrics.json'));
 for(const scale of [1,2])for(const row of metrics[scale]){
  expect(readFileSync(`public/assets/native-text/${row.id}${scale===2?'@2x':''}.png`))
   .toEqual(readFileSync(root+`${row.id}-${scale}.png`));
 }
 for(const name of readdirSync(root).filter(n=>/^(Tris|Borate|Acetate|EDTA).*\.png$/.test(n)))
  expect(readFileSync('public/assets/molecules/'+name)).toEqual(readFileSync(root+name));
});
