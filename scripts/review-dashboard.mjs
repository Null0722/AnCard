#!/usr/bin/env node
// Local editorial tool. Never expose this server to a network.
import http from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {randomBytes, createHash, timingSafeEqual} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateFrom} from './review-fields.mjs';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const queuePath=resolve(root,'catalog/HUMAN-QC.json');
const token=randomBytes(32).toString('hex');
const hash=s=>createHash('sha256').update(s).digest('hex');
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
const send=(res,status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{...headers,'Content-Type':type});res.end(typeof data==='string'?data:JSON.stringify(data));};
let busy=false;
const server=http.createServer(async(req,res)=>{
 try {
  const host=`127.0.0.1:${server.address().port}`;
  if(req.headers.host!==host) return send(res,403,{error:'Invalid host'});
  const origin=`http://${host}`;
  if(req.headers.origin && req.headers.origin!==origin) return send(res,403,{error:'Invalid origin'});
  const path=new URL(req.url,origin).pathname;
  if(req.method==='GET' && ['/','/app.js','/style.css'].includes(path)) {
   const file=path==='/'?'index.html':path.slice(1);
   return send(res,200,await readFile(resolve(root,'admin',file),'utf8'),file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');
  }
  const auth=String(req.headers['x-review-token']||'');
  if(auth.length!==token.length||!timingSafeEqual(Buffer.from(auth),Buffer.from(token)))return send(res,403,{error:'Unauthorized'});
  if(req.method==='GET'&&path==='/api/queue'){
   const raw=await readFile(queuePath,'utf8');
   return send(res,200,{queue:JSON.parse(raw),revision:hash(raw)});
  }
  if(req.method==='POST'&&path==='/api/approve'){
   if(req.headers.origin!==origin || req.headers['content-type']!=='application/json')return send(res,403,{error:'Invalid request origin'});
   if(busy)return send(res,409,{error:'Another save is in progress. Reload.'});
   busy=true;
   try {
    let body=''; for await(const chunk of req){body+=chunk;if(body.length>4096)throw Error('Request too large');}
    const {id,revision}=JSON.parse(body);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id||''))return send(res,400,{error:'Invalid card ID'});
    const raw=await readFile(queuePath,'utf8');
    if(hash(raw)!==revision)return send(res,409,{error:'The queue changed since it was loaded. Reload and review the current record.'});
    const queue=JSON.parse(raw), entry=queue.cards.find(c=>c.id===id);
    if(!entry||entry.humanVerified!==false)return send(res,409,{error:'Card is missing or already approved. Reload.'});
    const card=JSON.parse(await readFile(resolve(root,'catalog/cards',id+'.json'),'utf8'));
    if(card.id!==id||card.status!=='published'||card.name!==entry.name||card.issuer!==entry.issuer||JSON.stringify(candidateFrom(card))!==JSON.stringify(entry.candidate))return send(res,409,{error:'Card data differs from the queue. Run npm run qc:sync and review again.'});
    entry.humanVerified=true;
    await writeFile(queuePath,JSON.stringify(queue,null,2)+'\n');
    return send(res,200,{ok:true});
   } finally {busy=false;}
  }
  return send(res,404,{error:'Not found'});
 } catch(err){console.error(err);return send(res,500,{error:'Could not complete the request. Check the terminal.'});}
});
server.listen(0,'127.0.0.1',()=>console.log(`\nAnCard review dashboard: http://127.0.0.1:${server.address().port}/#${token}\nKeep this link private. Press Ctrl+C to stop. Approvals change local files only.\n`));
