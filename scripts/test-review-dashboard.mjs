#!/usr/bin/env node
// Exercise the local editor against a disposable real catalog and Git checkout.
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm,chmod} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {dirname,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const tmp=await mkdtemp(resolve(tmpdir(),'ancard-dashboard-test-')),repo=resolve(tmp,'repo');
let child;
function git(...args){return execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
async function req(base,token,path,{method='GET',body,origin=base,auth=true}={}){
 const headers={};if(auth)headers['X-Review-Token']=token;if(method==='POST'){headers['Content-Type']='application/json';headers.Origin=origin;}
 const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,data:await response.json()};
}
try {
 await cp(root,repo,{recursive:true,filter:source=>!['.git','node_modules'].includes(basename(source))});
 git('init','-b','main');git('config','user.name','AnCard Test');git('config','user.email','test@example.invalid');git('add','.');git('commit','-m','test baseline');
 if(process.argv.includes('--publish')){
  const remote=resolve(tmp,'remote.git');execFileSync('git',['init','--bare',remote],{stdio:'ignore'});
  git('remote','add','origin','https://github.com/Null0722/AnCard.git');
  git('config',`url.file://${remote}.insteadOf`,'https://github.com/Null0722/AnCard.git');
  git('push','-u','origin','main');
 }
 child=spawn(process.execPath,['scripts/review-dashboard.mjs'],{cwd:repo,env:{...process.env,ANCARD_NO_BROWSER:'1'},stdio:['ignore','pipe','pipe']});
 let stdout='';child.stdout.on('data',chunk=>stdout+=chunk);let stderr='';child.stderr.on('data',chunk=>stderr+=chunk);
 const deadline=Date.now()+10000;while(!/http:\/\/127\.0\.0\.1:\d+\/#\w+/.test(stdout)){if(child.exitCode!==null)throw Error('Server exited: '+stderr);if(Date.now()>deadline)throw Error('Server did not start.');await new Promise(r=>setTimeout(r,40));}
 const match=stdout.match(/(http:\/\/127\.0\.0\.1:\d+)\/#([a-f0-9]+)/),base=match[1],token=match[2];
 assert.equal((await req(base,token,'/api/queue',{auth:false})).status,403);
 assert.equal((await req(base,token,'/api/publish',{method:'POST',body:{},origin:'https://example.com'})).status,403);
 const q=(await req(base,token,'/api/queue')).data.queue;const original=q.cards.find(x=>x.humanVerified&&x.reviewStage==='directory');assert.ok(original,'Need an approved card fixture');const id=original.id;
 let detail=(await req(base,token,'/api/card?id='+id)).data;
 const oldRevision=detail.revision,edited=structuredClone(detail.card);edited.feeSummary+=' (test edit)';
 let result=await req(base,token,'/api/save',{method:'POST',body:{id,revision:detail.revision,card:edited}});assert.equal(result.status,200,JSON.stringify(result.data));
 detail=(await req(base,token,'/api/card?id='+id)).data;assert.equal(detail.entry.humanVerified,false);assert.equal(detail.entry.candidate.feeSummary,edited.feeSummary);
 let publicData=JSON.parse(await readFile(resolve(repo,'docs/data/cards.json'),'utf8'));let visible=publicData.cards.find(c=>c.id===id);assert.equal(visible.humanVerified,false);assert.equal(visible.annualFeeUsd,null);assert.equal(visible.feeSummary,'Annual fee: pending human review');
 assert.equal((await req(base,token,'/api/approve',{method:'POST',body:{id,revision:oldRevision}})).status,409);
 const bad=structuredClone(detail.card);bad.annualFeeUsd=-1;const rawBefore=await readFile(resolve(repo,'catalog/cards',id+'.json'),'utf8');
 result=await req(base,token,'/api/save',{method:'POST',body:{id,revision:detail.revision,card:bad}});assert.equal(result.status,400);assert.equal(await readFile(resolve(repo,'catalog/cards',id+'.json'),'utf8'),rawBefore);
 result=await req(base,token,'/api/approve',{method:'POST',body:{id,revision:detail.revision}});assert.equal(result.status,200,JSON.stringify(result.data));
 publicData=JSON.parse(await readFile(resolve(repo,'docs/data/cards.json'),'utf8'));visible=publicData.cards.find(c=>c.id===id);assert.equal(visible.humanVerified,true);assert.equal(visible.feeSummary,edited.feeSummary);
 if(process.argv.includes('--publish')){
  const unrelated=resolve(repo,'README.md'),before=await readFile(unrelated,'utf8');await writeFile(unrelated,before+'\nunrelated edit\n');
  result=await req(base,token,'/api/publish',{method:'POST',body:{}});assert.notEqual(result.status,200);assert.match(result.data.error,/outside this dashboard/);await writeFile(unrelated,before);
  const hook=resolve(tmp,'remote.git/hooks/pre-receive');await writeFile(hook,'#!/bin/sh\nexit 1\n');await chmod(hook,0o755);
  result=await req(base,token,'/api/publish',{method:'POST',body:{}});assert.notEqual(result.status,200);assert.match(result.data.error,/local commit/);
  await rm(hook);result=await req(base,token,'/api/publish',{method:'POST',body:{}});assert.equal(result.status,200,JSON.stringify(result.data));
  assert.equal(git('rev-parse','HEAD'),git('rev-parse','refs/remotes/origin/main'));assert.equal(git('status','--porcelain'),'');
  assert.match(git('log','-1','--format=%s'),/Update reviewed card details/);
 }
 console.log('Editorial dashboard tests passed: access, save, approval reset, validation, stale data'+(process.argv.includes('--publish')?', isolated Git publish':'')+'.');
} finally {
 if(child&&child.exitCode===null){child.kill();await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,2000))]);}
 await rm(tmp,{recursive:true,force:true});
}
