import {readFileSync} from 'node:fs';
// The modern Cinder harness rounds byte/255; original-release GUI saves prove
// different float32 palette constants. Preserve raw captures and replace only
// exact known harness palette entries when checking generated species colors.
const harness=JSON.parse(readFileSync('../reference/native/runtime/outputs.json','utf8'))[0].palette as number[][];
export const releasePalette: number[][]=JSON.parse(readFileSync('../reference/native/replay/palette-values/native-output.json','utf8')).Gel.Samples[0].Fragments.map((f:{Color:number[]})=>f.Color);
export function releasePaletteColor(color:number[]):number[] {
 const i=harness.findIndex(c=>c.length===color.length&&c.every((x,j)=>x===color[j]));
 return i<0 ? color : releasePalette[i];
}
