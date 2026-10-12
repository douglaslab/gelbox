import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {shapeNativeUiText} from '../../src/lib/gel/nativeUiText';
const oracle=JSON.parse(readFileSync('../reference/native/modern/ui-text/oracle.json','utf8'));
for(const scale of [1,2] as const)it(`matches native UIFont measurements and glyph placements at scale ${scale}`,()=>{
 for(const row of oracle[scale])expect(shapeNativeUiText(row.text,scale),JSON.stringify(row.text)).toEqual({size:row.size,placements:row.placements});
});
it('ships the independently captured native metrics and straight-alpha atlases unchanged',()=>{
 const root='../reference/native/modern/ui-text/';
 expect(readFileSync('src/lib/layout/nativeUiFont.json')).toEqual(readFileSync(root+'metrics.json'));
 for(const scale of [1,2])expect(readFileSync(`public/assets/native-text/ui-font-0${scale===2?'@2x':''}.png`))
  .toEqual(readFileSync(root+`atlas-${scale}-0.png`));
});
