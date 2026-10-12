import {expect,it} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
it('ships captured native dye labels and pinned molecule assets unchanged',()=>{
 const root='../reference/native/modern/shared-dye-scenes/';
 for(let dye=0;dye<4;dye++)for(const scale of [1,2]){
  expect(readFileSync(`public/assets/native-text/dye-label-${dye}${scale===2?'@2x':''}.png`))
   .toEqual(readFileSync(root+`dye-label-${dye}-${scale}.png`));
 }
 for(const name of readdirSync(root).filter(n=>/^(Xylene|Cresol|Bromphenol|Orange G).*\.png$/.test(n)))
  expect(readFileSync('public/assets/molecules/'+name)).toEqual(readFileSync(root+name));
});
