#!/usr/bin/env node
// Local-only editorial application. The public site remains a static, read-only catalog.
import http from 'node:http';
import {readFile, writeFile, mkdtemp, cp, mkdir, rm, rename} from 'node:fs/promises';
import {randomBytes, createHash, timingSafeEqual} from 'node:crypto';
import {execFile, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {tmpdir} from 'node:os';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {candidateFrom} from './review-fields.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const exec=promisify(execFile);
const token=randomBytes(32).toString('hex');
const hash=s=>createHash('sha256').update(s).digest('hex');
const json=o=>JSON.stringify(o,null,2)+'\n';
const queuePath='catalog/HUMAN-QC.json';
const generated=['docs/data/cards.json','catalog/REVIEW-SHEET.md'];
const cardPath=id=>`catalog/cards/${id}.json`;
const validId=id=>typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
const digest=(queue,card)=>hash(queue+'\0'+card);
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
const send=(res,status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{...headers,'Content-Type':type});res.end(typeof data==='string'?data:JSON.stringify(data));};
class UserError extends Error {constructor(message,status=400){super(message);this.status=status;}}
let busy=false;
async function command(program,args,options={}) {
 try {return await exec(program,args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024,timeout:120000,env:{...process.env,GIT_TERMINAL_PROMPT:'0'},...options});}
 catch(e){throw new UserError((e.stderr||e.stdout||e.message||'Command failed').trim().slice(-3000));}
}
const git=(...args)=>command('git',args).then(r=>r.stdout.trim());
async function stateFile(){
 try{return resolve(root,await git('rev-parse','--git-path','ancard-dashboard-state.json'));}
 catch{throw new UserError('Open the dashboard from a Git clone of AnCard. Install Git and use GitHub Desktop to clone the repository first.');}
}
async function loadState(){const path=await stateFile();try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function saveState(state){const path=await stateFile();await writeFile(path,json(state));}
async function clearState(){await rm(await stateFile(),{force:true});}
async function readCurrent(id){
 if(!validId(id))throw new UserError('Invalid card ID.');
 const [queueRaw,cardRaw]=await Promise.all([readFile(resolve(root,queuePath),'utf8'),readFile(resolve(root,cardPath(id)),'utf8')]);
 const queue=JSON.parse(queueRaw), card=JSON.parse(cardRaw), entry=queue.cards.find(c=>c.id===id);
 if(!entry||card.id!==id||card.status!=='published')throw new UserError('Card is not in the review queue.',404);
 return {queueRaw,cardRaw,queue,card,entry,revision:digest(queueRaw,cardRaw)};
}
function assertCurrent(current,revision){if(current.revision!==revision)throw new UserError('The card or review queue changed. Reload the card before saving.',409);}
async function gitChanges(){
 const out=(await command('git',['status','--porcelain=v1','-z','--untracked-files=all'])).stdout;
 const items=out.split('\0').filter(Boolean), paths=[];
 for(const item of items){const code=item.slice(0,2),path=item.slice(3);if(code.includes('R')||code.includes('C'))throw new UserError('A renamed or copied file is present. Resolve it before using the dashboard.');paths.push(path);}
 return paths;
}
async function ensureTargetsSafe(paths){
 let state=await loadState(); const head=await git('rev-parse','HEAD');
 if(state?.pendingCommit)throw new UserError('A previous publish needs to be retried before making more edits.');
 if(state&&state.baseHead!==head)throw new UserError('The repository changed since the dashboard started saving. Resolve the Git changes before continuing.');
 if(!state)state={baseHead:head,files:{},pendingCommit:null};
 const dirty=new Set(await gitChanges());
 for(const p of paths){
  if(dirty.has(p)){
   const expected=state.files[p];const actual=hash(await readFile(resolve(root,p),'utf8'));
   if(!expected||actual!==expected)throw new UserError(`The file ${p} has changes outside this dashboard. Preserve and resolve them before editing it.`,409);
  }
 }
 return state;
}
async function runCompiler(dir){
 try {
  await command(process.execPath,['scripts/catalog.mjs'],{cwd:dir});
  await command(process.execPath,['scripts/review-sheet.mjs'],{cwd:dir});
 } catch(e){throw new UserError('The proposed card could not be saved. Please check its fields: '+e.message);}
}
// Compile in a temporary copy before touching the user's files. A changed approved
// record is immediately demoted and regenerated output hides its unreviewed terms.
async function applyUpdate(current,nextCard,approve){
 const {queue,entry}=current;
 if(approve){
  if(entry.humanVerified)throw new UserError('This card is already approved.');
  if(entry.name!==nextCard.name||entry.issuer!==nextCard.issuer||JSON.stringify(entry.candidate)!==JSON.stringify(candidateFrom(nextCard)))throw new UserError('The card and review queue differ. Sync and review the current card before approval.',409);
  entry.humanVerified=true;
 }else{
  for(const key of ['id','status','fictional'])if(JSON.stringify(nextCard[key])!==JSON.stringify(current.card[key]))throw new UserError('Card ID, publication status, and fictional status cannot be changed here.');
  if(JSON.stringify(nextCard)===JSON.stringify(current.card))throw new UserError('There are no changes to save.');
  entry.name=nextCard.name;entry.issuer=nextCard.issuer;entry.candidate=candidateFrom(nextCard);
  entry.humanVerified=false;entry.reviewNotes='';entry.reviewedBy='';
  queue.cards.sort((a,b)=>a.name.localeCompare(b.name)||a.issuer.localeCompare(b.issuer));
 }
 const work=await mkdtemp(resolve(tmpdir(),'ancard-review-'));
 try {
  await Promise.all([cp(resolve(root,'catalog'),resolve(work,'catalog'),{recursive:true}),cp(resolve(root,'scripts'),resolve(work,'scripts'),{recursive:true}),mkdir(resolve(work,'docs/data'),{recursive:true})]);
  await writeFile(resolve(work,cardPath(nextCard.id)),json(nextCard));
  await writeFile(resolve(work,queuePath),json(queue));
  await runCompiler(work);
  const outputs=new Map();
  if(!approve)outputs.set(cardPath(nextCard.id),json(nextCard));
  outputs.set(queuePath,json(queue));
  for(const p of generated)outputs.set(p,await readFile(resolve(work,p),'utf8'));
  const originals=new Map();for(const p of outputs.keys())originals.set(p,await readFile(resolve(root,p),'utf8'));
  const latestCard=await readFile(resolve(root,cardPath(nextCard.id)),'utf8');
  if(digest(originals.get(queuePath),latestCard)!==current.revision)throw new UserError('The card or queue changed during validation. Reload and try again.',409);
  const changed=[...outputs].filter(([p,content])=>content!==originals.get(p));
  const state=await ensureTargetsSafe(changed.map(([p])=>p));
  // Recheck after potentially slow Git operations to avoid overwriting other edits.
  for(const [p] of changed)if(await readFile(resolve(root,p),'utf8')!==originals.get(p))throw new UserError(`${p} changed during validation. Reload and try again.`,409);
  if(await readFile(resolve(root,cardPath(nextCard.id)),'utf8')!==current.cardRaw)throw new UserError('The card changed during validation. Reload and try again.',409);
  const written=[];
  try {
   for(const [p,content] of changed){const dest=resolve(root,p),temp=dest+'.ancard-'+randomBytes(6).toString('hex');await writeFile(temp,content);await rename(temp,dest);written.push(p);state.files[p]=hash(content);}
   await saveState(state);
  } catch(e){for(const p of written)await writeFile(resolve(root,p),originals.get(p));throw e;}
 } finally {await rm(work,{recursive:true,force:true});}
}
async function verifiedRemote(){
 const branch=await git('branch','--show-current');
 if(branch!=='main')throw new UserError('Publishing requires the main branch. Switch to main in GitHub Desktop first.');
 const remote=await git('config','--get','remote.origin.url');
 if(!/^(https:\/\/github\.com\/Null0722\/AnCard(?:\.git)?\/?|git@github\.com:Null0722\/AnCard(?:\.git)?)$/i.test(remote))throw new UserError('The origin remote must point to Null0722/AnCard on GitHub.');
 await git('fetch','origin','main');
 return git('rev-parse','refs/remotes/origin/main');
}
async function publish(){
 const state=await loadState();if(!state)throw new UserError('There are no dashboard changes to publish.');
 const remoteHead=await verifiedRemote(), head=await git('rev-parse','HEAD');
 if(state.pendingCommit){
  if(head!==state.pendingCommit)throw new UserError('The local branch changed after the previous publish attempt. Resolve it in GitHub Desktop.');
  if(remoteHead===state.pendingCommit){await clearState();return {message:'The previous publish already reached GitHub. Check the Pages deployment.'};}
  if(remoteHead!==state.baseHead)throw new UserError('GitHub changed since the publish attempt. Resolve the changes in GitHub Desktop.');
  if((await gitChanges()).length)throw new UserError('Other local changes exist. Resolve them before retrying publication.');
 }else{
  if(head!==state.baseHead||remoteHead!==head)throw new UserError('Your local main branch and GitHub are out of sync. Keep your changes and resolve the update in GitHub Desktop before publishing.');
  const changes=await gitChanges();if(!changes.length)throw new UserError('There are no dashboard changes to publish.');
  for(const p of changes){if(!state.files[p]||hash(await readFile(resolve(root,p),'utf8'))!==state.files[p])throw new UserError(`The file ${p} has changes outside this dashboard. Resolve them before publishing.`);}
  // Never include pre-staged work or unrelated files in the automated commit.
  if(await git('diff','--cached','--name-only'))throw new UserError('There are already staged changes. Resolve them in GitHub Desktop first.');
  try {await command(process.platform==='win32'?'cmd.exe':'npm',process.platform==='win32'?['/d','/s','/c','npm test']:['test']);}
  catch(e){throw new UserError('Validation failed. Nothing was committed or published. '+e.message);}
  for(const p of changes)if(hash(await readFile(resolve(root,p),'utf8'))!==state.files[p])throw new UserError(`${p} changed during validation. Nothing was published.`);
  const latestChanges=await gitChanges();if(JSON.stringify([...latestChanges].sort())!==JSON.stringify([...changes].sort()))throw new UserError('Files changed during validation. Nothing was published.');
  try {await git('add','--',...changes);await git('commit','-m','Update reviewed card details');}
  catch(e){await git('reset','--',...changes).catch(()=>{});throw new UserError('Could not create a Git commit. Make sure Git has your name and email configured. '+e.message);}
  state.pendingCommit=await git('rev-parse','HEAD');await saveState(state);
 }
 try {await git('push','origin','HEAD:main');}
 catch(e){throw new UserError('The changes were saved in a local commit, but GitHub rejected the push. Sign in with GitHub Desktop and retry Publish. '+e.message);}
 await clearState();return {message:'Changes pushed to GitHub. The Pages deployment can take a few minutes; check its status before relying on the live site.'};
}
async function sync(){
 if(await loadState())throw new UserError('You have dashboard changes. Publish or resolve them before syncing.');
 if((await gitChanges()).length)throw new UserError('There are local changes. Resolve them in GitHub Desktop before syncing.');
 await verifiedRemote();await git('merge','--ff-only','origin/main');
 return {message:'Updated from GitHub. Close this window and restart the dashboard to load any application updates.'};
}
const server=http.createServer(async(req,res)=>{
 try {
  const host=`127.0.0.1:${server.address().port}`,origin=`http://${host}`;
  if(req.headers.host!==host||req.headers.origin&&req.headers.origin!==origin)return send(res,403,{error:'Invalid origin.'});
  const url=new URL(req.url,origin),path=url.pathname;
  const assets={'/':'admin/index.html','/app.js':'admin/app.js','/style.css':'admin/style.css','/card-visual.js':'docs/assets/card-visual.js'};
  if(req.method==='GET'&&assets[path])return send(res,200,await readFile(resolve(root,assets[path]),'utf8'),path.endsWith('.js')?'text/javascript; charset=utf-8':path.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');
  const auth=Buffer.from(String(req.headers['x-review-token']||'')),secret=Buffer.from(token);
  if(auth.length!==secret.length||!timingSafeEqual(auth,secret))return send(res,403,{error:'Unauthorized.'});
  if(req.method==='GET'&&path==='/api/queue')return send(res,200,{queue:JSON.parse(await readFile(resolve(root,queuePath),'utf8'))});
  if(req.method==='GET'&&path==='/api/card'){
   const c=await readCurrent(url.searchParams.get('id'));return send(res,200,{card:c.card,entry:c.entry,revision:c.revision});
  }
  if(req.method==='POST'&&['/api/save','/api/approve','/api/publish','/api/sync'].includes(path)){
   if(req.headers.origin!==origin||req.headers['content-type']!=='application/json')return send(res,403,{error:'Invalid request origin.'});
   if(busy)return send(res,409,{error:'Another operation is in progress. Please wait.'});busy=true;
   try {
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>128000)throw new UserError('Request too large.',413);}
    let data;try{data=JSON.parse(body);}catch{throw new UserError('Invalid request.');}
    if(path==='/api/publish')return send(res,200,await publish());
    if(path==='/api/sync')return send(res,200,await sync());
    const current=await readCurrent(data.id);assertCurrent(current,data.revision);
    if(path==='/api/save'){
     if(!data.card||typeof data.card!=='object'||Array.isArray(data.card)||data.card.id!==data.id)throw new UserError('Invalid card data.');
     await applyUpdate(current,data.card,false);
    } else await applyUpdate(current,current.card,true);
    return send(res,200,{ok:true});
   } finally {busy=false;}
  }
  return send(res,404,{error:'Not found.'});
 } catch(e){if(!(e instanceof UserError))console.error(e);return send(res,e.status||500,{error:e instanceof UserError?e.message:'Could not complete the request. Check the dashboard window for details.'});}
});
server.listen(0,'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${server.address().port}/#${token}`;
 console.log(`\nAnCard editorial dashboard: ${url}\nKeep this link private. Close this window or press Ctrl+C to stop.\n`);
 if(process.platform==='win32'&&!process.env.ANCARD_NO_BROWSER){const child=spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{detached:true,stdio:'ignore'});child.on('error',()=>{});child.unref();}
});
