import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml','.json':'application/json'};
for(const prefix of ['/','/gelbox/'])test(`built app at ${prefix} loads controls and roundtrips native files`,async({page},info)=>{
 const outside:string[]=[];
 const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url!,'http://localhost').pathname);
  if(!pathname.startsWith(prefix)){outside.push(pathname);res.writeHead(404).end();return;}
  const relative=pathname.slice(prefix.length)||'index.html';
  const filename=path.resolve('dist',relative);
  if(!filename.startsWith(path.resolve('dist')+path.sep)){res.writeHead(404).end();return;}
  try {const bytes=await readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]??'application/octet-stream'}).end(bytes);}
  catch {res.writeHead(404).end();}
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const port=(server.address() as {port:number}).port;
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const backend=info.project.name.endsWith('webgl2')?'webgl2':'webgpu';
  await page.addInitScript(b=>{
   localStorage.setItem('gelBackend',b);
   localStorage.setItem('gelSharedPresentation','1'); // Migration is development-only.
   const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type:any,options:any){const c=get.call(this,type,options);if(c)this.setAttribute('data-test-context',type);return c;} as typeof get;
  },backend);
  await page.goto(`http://127.0.0.1:${port}${prefix}#/gel`);
  await expect(page.getByTestId('band-0')).toBeVisible();
  await expect(page.getByTestId('shared-scene')).toHaveCount(0);
  await expect(page.getByTestId('gel-canvas')).toHaveAttribute('data-test-context',backend);
  const checkImages=async()=>{
   await expect.poll(()=>page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')))).toEqual([]);
  };
  await checkImages();
  await page.getByTestId('settings-button').click();await checkImages();
  await page.getByTestId('band-0').click();await checkImages();
  const settings=page.getByRole('button',{name:'Application settings'});
  await settings.click();
  const fixture=path.resolve('../reference/native/files/ladder-after-selection.gel.json');
  await page.getByTestId('file-input').setInputFiles(fixture);
  await expect(settings).toHaveAttribute('aria-expanded','false');
  await settings.click();
  await page.getByTestId('file-input').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
  await expect(page.getByTestId('file-error')).toContainText('Open failed');
  const downloading=page.waitForEvent('download');await page.getByTestId('save-gel-btn').click();
  const download=await downloading;
  expect(JSON.parse(await readFile((await download.path())!,'utf8'))).toEqual(JSON.parse(await readFile(fixture,'utf8')));
  expect(outside.filter(p=>p!=='/favicon.ico')).toEqual([]);expect(errors).toEqual([]);
 }finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
