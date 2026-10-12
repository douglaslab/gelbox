import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const root='../reference/native/files/interop/xml';
for(const name of ['fields','defaults','ignored-children','empty'])test(`native XML constructor: ${name}`,async({page})=>{
 const xml=await fs.readFile(path.join(root,`${name}.xml`),'utf8');
 const expected=JSON.parse(await fs.readFile(path.join(root,`${name}.native.json`),'utf8')).Sample;
 // JsonTree's writer formats real values with six significant digits.
 // Compare that representation; this is not a floating-point tolerance.
 const normalize=(value:any):any=>typeof value==='number'?Number(value.toPrecision(6)):Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)])):value;
 await page.goto('/#/gel');
 const actual=await page.evaluate(async xml=>{
  const {deserializeFile,serializeSample}=await import('/src/lib/gel/serialize.ts');
  const result=deserializeFile(xml);if(result.kind!=='sample')throw Error('Expected sample');
  return JSON.parse(serializeSample(result.sample)).Sample;
 },xml);
 expect(normalize(actual)).toEqual({...expected,Fragments:expected.Fragments??[]});
});
test('XML external declarations make no requests and unsafe aggregate indices are rejected',async({page})=>{
 const requests:string[]=[];
 await page.route('https://gelbox-xml.invalid/**',async route=>{requests.push(route.request().url());await route.abort();});
 await page.goto('/#/gel');
 const result=await page.evaluate(async()=>{
  const {deserializeFile}=await import('/src/lib/gel/serialize.ts');
  const safe=deserializeFile('<!DOCTYPE Sample SYSTEM "https://gelbox-xml.invalid/external.dtd"><Sample name="External declaration"><Fragment><Bases value="500"/></Fragment></Sample>');
  const errors=[];
  for(const size of [-1,1,1000000000]){
   try{deserializeFile(`<Sample><Fragment><Aggregate Size="${size}" Weight="2"/></Fragment></Sample>`);errors.push('accepted');}
   catch(error){errors.push(String(error));}
  }
  return {safe,errors};
 });
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 expect(result.safe.kind).toBe('sample');
 expect(requests).toEqual([]);
 for(const error of result.errors)expect(error).toContain('use native JSON for multimers');
});
