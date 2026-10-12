import {readFileSync} from 'node:fs';
import {expect, test} from 'vitest';
import {fragToBands} from '../../src/lib/sim/gelSim';
import type {Sample} from '../../src/lib/sim/sample';
import type {SimContext} from '../../src/lib/sim/mobility';
import type {Rect} from '../../src/lib/sim/band';

// Diagnostic scope: original x86 geometry with host powf/inflate hooks, not a
// replacement for the canonical native corpus or original-app GUI qualification.
const cases: Array<{id:string;sample:Sample;fragment:number;ctx:SimContext;wellRect:Rect;lane:number}>=JSON.parse(readFileSync('../reference/native/numerical/cases.json','utf8'));
const {controls}: {controls:Array<{id:string;bases:number;rect:number[]}>}=JSON.parse(readFileSync('../reference/native/replay/overlapping-tiers/emulated-diagnostic/result.json','utf8'));
for(const control of controls){
 test(`original release geometry instruction order: ${control.id}`,()=>{
  const c=cases.find(c=>c.id===control.id)!;
  const sample={...c.sample,fragments:[{...c.sample.fragments[c.fragment],bases:control.bases}]};
  const {rect}=fragToBands(sample,0,c.wellRect,c.lane,c.ctx)[0];
  expect([rect.x1,rect.y1,rect.x2,rect.y2]).toEqual(control.rect);
 });
}
