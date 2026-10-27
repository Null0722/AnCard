#!/usr/bin/env node
// Regression checks for AnCard public data, its human QC gate, and plain punctuation.
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const load=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const published=await load('docs/data/cards.json');
const queue=await load('catalog/HUMAN-QC.json');
function assert(condition,message){if(!condition)throw new Error(message);}
assert(Array.isArray(published.cards)&&Array.isArray(queue.cards),'Catalog and QC must be arrays.');
assert(published.cards.length===queue.cards.length,'Review queue and public catalog counts differ.');
const reviews=new Map(queue.cards.map(item=>[item.id,item]));
assert(reviews.size===queue.cards.length,'Review queue contains duplicate card IDs.');
const permittedPending=new Set(['id','name','issuer','status','fictional','tone','humanVerified',
 'summary','primaryLabel','feeSummary','annualFeeUsd','rewards','categories','features',
 'plainEnglish','watchOut','limitations','verifiedAt','issuerSource','verificationLevel',
 'imageFront','accessType','airlineProgram']);
const seen=new Set();
for(const card of published.cards){
 assert(!seen.has(card.id),'Duplicate public ID '+card.id);seen.add(card.id);
 const review=reviews.get(card.id);
 assert(review&&review.name===card.name&&review.issuer===card.issuer,'No matching review for '+card.id);
 assert(card.fictional===false,'Fictional cards must not be public.');
 const url=new URL(card.issuerSource);
 assert(url.protocol==='https:'&&!url.search&&!url.hash,'Unclean public source URL: '+card.id);
 if(review.humanVerified){
   assert(card.status==='published'&&card.humanVerified===true,'Approved record not published: '+card.id);
 }else{
   assert(card.status==='pending_review'&&card.humanVerified===false,'Unapproved record exposed: '+card.id);
   for(const key of Object.keys(card))assert(permittedPending.has(key),'Unexpected pending field '+key+': '+card.id);
   assert(card.annualFeeUsd===null&&card.verifiedAt===null,'Unapproved monetary or date data: '+card.id);
   assert(card.primaryLabel==='Pending human review'&&card.feeSummary==='Annual fee: pending human review','Pending text changed: '+card.id);
   assert(Array.isArray(card.rewards)&&card.rewards.length===0&&Array.isArray(card.categories)&&card.categories.length===0,'Unapproved reward data: '+card.id);
   assert(Array.isArray(card.features)&&card.features.every(v=>v==='airline'),'Unapproved card feature: '+card.id);
   assert(card.summary==='Terms and benefits are awaiting human review.','Unapproved description: '+card.id);
 }
}
async function walk(dir){
 const children=await readdir(resolve(root,dir),{withFileTypes:true});
 let all=[];
 for(const child of children){
  const path=dir+'/'+child.name;
  if(child.isDirectory())all.push(...await walk(path));
  else if(child.isFile())all.push(path);
 }
 return all;
}
const textFiles=[
 ...(await Promise.all(['.github','catalog','docs','project','scripts'].map(walk))).flat(),
 'README.md','CHANGELOG.md','package.json','.gitignore'
];
for(const path of textFiles){
 if(!/\.(?:json|mjs|js|md|html|css|yml|yaml|svg)$/.test(path)&&path!=='.gitignore')continue;
 const content=await readFile(resolve(root,path),'utf8');
 assert(!content.includes('\u2014'),'Em dash found in '+path);
}
console.log('AnCard quality checks passed:',published.cards.length,'cards,',published.cards.filter(c=>!c.humanVerified).length,'pending, no unapproved financial details, no em dashes.');
