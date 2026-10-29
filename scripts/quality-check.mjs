#!/usr/bin/env node
// Regression checks for AnCard public data, its human QC gate, and plain punctuation.
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const load=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const published=await load('docs/data/cards.json');
const queue=await load('catalog/HUMAN-QC.json');
const offers=await load('catalog/OFFER-QC.json');
const approvedOffers=new Map(offers.cards.filter(c=>c.approved).map(c=>[c.id,c]));
function assert(condition,message){if(!condition)throw new Error(message);}
assert(Array.isArray(published.cards)&&Array.isArray(queue.cards),'Catalog and QC must be arrays.');
assert(published.cards.length<=queue.cards.length,'Public catalog cannot exceed the review queue.');
assert(published.reviewProgress?.approved===queue.cards.filter(x=>x.humanVerified).length && published.reviewProgress?.total===queue.cards.length,'Review progress metadata does not match the approval queue.');
const reviews=new Map(queue.cards.map(item=>[item.id,item]));
assert(reviews.size===queue.cards.length,'Review queue contains duplicate card IDs.');
const permittedPending=new Set(['id','name','issuer','status','fictional','tone','humanVerified',
 'summary','primaryLabel','feeSummary','annualFeeUsd','rewards','categories','features',
 'plainEnglish','watchOut','limitations','verifiedAt','issuerSource','verificationLevel',
 'imageFront','accessType','airlineProgram']);
const seen=new Set();
for(const entry of queue.cards)assert(['directory','research'].includes(entry.reviewStage),'Invalid review stage '+entry.id);
for(const card of published.cards){
 assert(!seen.has(card.id),'Duplicate public ID '+card.id);seen.add(card.id);
 const review=reviews.get(card.id);
 assert(review&&review.name===card.name&&review.issuer===card.issuer,'No matching review for '+card.id);
 assert(card.fictional===false,'Fictional cards must not be public.');
 const url=new URL(card.issuerSource);
 assert(url.protocol==='https:'&&!url.search&&!url.hash,'Unclean public source URL: '+card.id);
 if(review.humanVerified){
   assert(card.status==='published'&&card.humanVerified===true,'Approved record not published: '+card.id);
   const offer=approvedOffers.get(card.id);
   if(offer)assert(card.signUpBenefit?.headline===offer.candidate.headline&&card.signUpBenefit?.observedAt===offer.observedAt,'Approved offer not present: '+card.id);
   else assert(card.signUpBenefit===undefined,'Unapproved offer was exposed: '+card.id);
 }else{
   assert(card.status==='pending_review'&&card.humanVerified===false,'Unapproved record exposed: '+card.id);
   assert(!card.signUpBenefit,'Bonus must not be published for a pending card: '+card.id);
   for(const key of Object.keys(card))assert(permittedPending.has(key),'Unexpected pending field '+key+': '+card.id);
   assert(card.annualFeeUsd===null&&card.verifiedAt===null,'Unapproved monetary or date data: '+card.id);
   assert(card.primaryLabel==='Pending human review'&&card.feeSummary==='Annual fee: pending human review','Pending text changed: '+card.id);
   assert(Array.isArray(card.rewards)&&card.rewards.length===0&&Array.isArray(card.categories)&&card.categories.length===0,'Unapproved reward data: '+card.id);
   assert(Array.isArray(card.features)&&card.features.every(v=>v==='airline'),'Unapproved card feature: '+card.id);
   assert(card.summary==='Terms and benefits are awaiting human review.','Unapproved description: '+card.id);
 }
}
for(const entry of offers.cards){
 assert(reviews.has(entry.id),'Research signup offer has unknown card id: '+entry.id);
 assert(!entry.approved||reviews.get(entry.id).humanVerified,'Sign-up bonus cannot precede card QC: '+entry.id);
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
for(const entry of queue.cards){if(entry.reviewStage==='research'&&!entry.humanVerified)assert(!seen.has(entry.id),'Unapproved research card leaked to public directory: '+entry.id);else assert(seen.has(entry.id),'Approved or established card is missing from public catalog: '+entry.id);}
console.log('AnCard quality checks passed:',published.cards.length,'public cards,',queue.cards.length,'research and directory entries, no unapproved financial details, no em dashes.');
