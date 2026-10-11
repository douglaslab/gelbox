import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml','.json':'application/json'};
export async function serveBuiltApp(prefix='/'){
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
  const port=(server.address() as {port:number}).port;
 return {url:`http://127.0.0.1:${port}${prefix}`,outside,close:()=>new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()))};
}
