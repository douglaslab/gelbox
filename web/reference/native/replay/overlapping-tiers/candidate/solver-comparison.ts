import {readFileSync,writeFileSync} from 'node:fs';
import {solveBasesForY} from '/Users/shawn/.codex/worktrees/3f9f/gel/ts/src/lib/sim/solver';
const cases=JSON.parse(readFileSync('/Users/shawn/.codex/worktrees/3f9f/gel/reference/native/numerical/cases.json','utf8'));
const fast=JSON.parse(readFileSync('/tmp/gel-fast-full-corpus.json','utf8'));
const strict=JSON.parse(readFileSync('/Users/shawn/.codex/worktrees/3f9f/gel/reference/native/numerical/outputs.json','utf8'));
const mismatches=[];let targets=0,fastMatches=0,strictMatches=0;
for(let i=0;i<cases.length;i++){const c=cases[i];for(let j=0;j<fast[i].solved.length;j++){const e=fast[i].solved[j];const s=strict[i].solved[j];const actual=solveBasesForY({targetY:e.targetY,aggregate:e.aggregate,frag:c.sample.fragments[c.fragment],lane:c.lane,ctx:c.ctx,wellRect:c.wellRect});targets++;if(actual===e.bases)fastMatches++;if(actual===s.bases)strictMatches++;if(actual!==e.bases)mismatches.push({id:c.id,target:e.targetY,aggregate:e.aggregate,actual,fast:e.bases,strict:s.bases});}}
writeFileSync('/tmp/gel-fast-corpus-comparison.json',JSON.stringify({targets,fastMatches,strictMatches,mismatches},null,2));console.log({targets,fastMatches,strictMatches,mismatches:mismatches.length});
